import { useState, useEffect, useRef } from 'react';
import { Command, TrainingSettings } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Pause, Play, X } from 'lucide-react';

interface TrainingSessionProps {
  commands: Command[];
  trainingSettings: TrainingSettings;
  onEndTraining: () => void;
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
}

interface ScheduledCommand {
  commandId: string;
  time: number; // 执行时间（相对于训练开始的秒数）
}

export function TrainingSession({
  commands,
  trainingSettings,
  onEndTraining,
  setCommands,
}: TrainingSessionProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [nextCommandTime, setNextCommandTime] = useState<number | null>(null);
  const [completedCommands, setCompletedCommands] = useState<{ [key: string]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const totalPausedRef = useRef<number>(0);
  const scheduleRef = useRef<ScheduledCommand[]>([]);
  const executedIndexRef = useRef<number>(0);

  // Fisher-Yates 洗牌算法，确保真正的随机
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 生成训练计划
  useEffect(() => {
    const schedule: ScheduledCommand[] = [];
    
    // 只收集选中的且 sessionCount > 0 的指令
    const selectedCommands = commands.filter(cmd => cmd.selected && cmd.sessionCount > 0);
    
    // 收集所有需要执行的指令
    const allCommands: string[] = [];
    selectedCommands.forEach((command) => {
      for (let i = 0; i < command.sessionCount; i++) {
        allCommands.push(command.id);
      }
    });

    // 使用 Fisher-Yates 算法打乱指令顺序，确保真正随机
    const shuffledCommands = shuffleArray(allCommands);

    // 为每个指令分配随机时间点
    let currentTime = 0;
    shuffledCommands.forEach((commandId) => {
      // 添加指令间的随机间隔
      const breakTime = Math.random() * (trainingSettings.maxBreakTime - trainingSettings.minBreakTime) + trainingSettings.minBreakTime;
      currentTime += breakTime;
      
      // 确保不超过训练总时长
      if (currentTime < trainingSettings.duration) {
        schedule.push({
          commandId,
          time: currentTime,
        });
      }
    });

    scheduleRef.current = schedule;
    executedIndexRef.current = 0;

    console.log(`训练计划已生成：共 ${schedule.length} 个指令，时长 ${trainingSettings.duration} 秒`);

    // 设置第一个指令的时间
    if (scheduleRef.current.length > 0) {
      setNextCommandTime(scheduleRef.current[0].time);
    }
  }, []);

  // 训练计时器
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current - totalPausedRef.current) / 1000);
      setElapsedTime(elapsed);

      // 检查是否到达训练结束时间
      if (elapsed >= trainingSettings.duration) {
        setIsCompleted(true);
        console.log('训练完成！');
        // 3秒后自动结束
        setTimeout(() => {
          onEndTraining();
        }, 3000);
        return;
      }

      // 检查是否需要播放指令
      const schedule = scheduleRef.current;
      const currentIndex = executedIndexRef.current;

      if (currentIndex < schedule.length) {
        const nextCommand = schedule[currentIndex];
        if (elapsed >= nextCommand.time) {
          playCommand(nextCommand.commandId);
          executedIndexRef.current++;
          
          // 更新下一个指令的时间
          if (executedIndexRef.current < schedule.length) {
            setNextCommandTime(schedule[executedIndexRef.current].time);
          } else {
            setNextCommandTime(null);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, trainingSettings.duration, onEndTraining]);

  const playCommand = (commandId: string) => {
    const command = commands.find(c => c.id === commandId);
    if (command?.audioUrl) {
      const audio = new Audio(command.audioUrl);
      audio.play();
      setCurrentCommand(command.name);
      
      console.log(`播放指令: ${command.name}`);
      
      // 更新完成计数
      setCompletedCommands(prev => ({
        ...prev,
        [commandId]: (prev[commandId] || 0) + 1,
      }));

      // 增加该指令的训练次数
      setCommands(prevCommands => 
        prevCommands.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, trainingCount: cmd.trainingCount + 1 }
            : cmd
        )
      );

      // 3秒后清除当前指令显示
      setTimeout(() => {
        setCurrentCommand(null);
      }, 3000);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      // 恢复训练
      const pauseDuration = Date.now() - pausedTimeRef.current;
      totalPausedRef.current += pauseDuration;
      setIsPaused(false);
    } else {
      // 暂停训练
      pausedTimeRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / trainingSettings.duration) * 100;
  const timeUntilNext = nextCommandTime !== null ? Math.max(0, nextCommandTime - elapsedTime) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {isCompleted ? '训练完成！' : '训练进行中'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 训练完成显示 */}
          {isCompleted && (
            <div className="bg-green-500 text-white p-8 rounded-lg text-center">
              <p className="text-5xl mb-2">🎉</p>
              <p className="text-2xl">训练完成！</p>
              <p className="text-sm opacity-90 mt-2">辛苦了，休息一下吧</p>
            </div>
          )}

          {/* 当前指令显示 */}
          {!isCompleted && currentCommand && (
            <div className="bg-orange-500 text-white p-8 rounded-lg text-center animate-pulse">
              <p className="text-sm opacity-90">当前指令</p>
              <p className="text-4xl mt-2">{currentCommand}</p>
            </div>
          )}

          {/* 时间进度 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>已训练: {formatTime(elapsedTime)}</span>
              <span>总时长: {formatTime(trainingSettings.duration)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* 下一个指令倒计时 */}
          {nextCommandTime !== null && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">下一个指令</p>
              <p className="text-2xl text-blue-600">{formatTime(timeUntilNext)}</p>
            </div>
          )}

          {/* 指令完成统计 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm mb-2">完成进度</p>
            <div className="space-y-2">
              {commands
                .filter(cmd => cmd.selected && cmd.sessionCount > 0)
                .sort((a, b) => a.order - b.order)
                .map((command) => {
                  const completed = completedCommands[command.id] || 0;
                  return (
                    <div key={command.id} className="flex justify-between items-center">
                      <span className="text-sm">{command.name}</span>
                      <span className="text-sm">
                        {completed} / {command.sessionCount}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={togglePause}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  继续
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  暂停
                </>
              )}
            </Button>
            <Button
              onClick={onEndTraining}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <X className="w-5 h-5 mr-2" />
              结束训练
            </Button>
          </div>

          {isPaused && (
            <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">训练已暂停</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
