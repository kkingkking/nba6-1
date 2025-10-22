import { Command, TrainingSettings, CommandConfig } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface TrainingConfigProps {
  commands: Command[];
  trainingSettings: TrainingSettings;
  setTrainingSettings: React.Dispatch<React.SetStateAction<TrainingSettings>>;
  onStartTraining: () => void;
}

export function TrainingConfig({
  commands,
  trainingSettings,
  setTrainingSettings,
  onStartTraining,
}: TrainingConfigProps) {
  // 只获取选中的指令
  const selectedCommands = commands.filter(cmd => cmd.selected);

  const canStartTraining = () => {
    if (selectedCommands.length === 0) return false;
    
    // 检查是否有指令的 sessionCount > 0
    const hasValidCommands = selectedCommands.some(cmd => cmd.sessionCount > 0);
    if (!hasValidCommands) return false;
    
    // 检查所有 sessionCount > 0 的指令是否都已录音
    const hasRecordedAudio = selectedCommands
      .filter(cmd => cmd.sessionCount > 0)
      .every(cmd => cmd.audioUrl);
    
    return hasRecordedAudio;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">训练总设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">训练时长: {formatTime(trainingSettings.duration)}</Label>
            <Slider
              value={[trainingSettings.duration]}
              onValueChange={([value]) => setTrainingSettings({ ...trainingSettings, duration: value })}
              min={60}
              max={1800}
              step={30}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">最小间隔(秒)</Label>
              <Input
                type="number"
                value={trainingSettings.minBreakTime}
                onChange={(e) => setTrainingSettings({
                  ...trainingSettings,
                  minBreakTime: parseInt(e.target.value) || 0
                })}
                min={1}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">最大间隔(秒)</Label>
              <Input
                type="number"
                value={trainingSettings.maxBreakTime}
                onChange={(e) => setTrainingSettings({
                  ...trainingSettings,
                  maxBreakTime: parseInt(e.target.value) || 0
                })}
                min={1}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">训练指令预览</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {selectedCommands.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              请先在"指令管理"中选中要训练的指令
            </p>
          ) : (
            <div className="space-y-2">
              {[...selectedCommands].sort((a, b) => a.order - b.order).map((command) => {
                return (
                  <div key={command.id} className="p-2.5 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!command.audioUrl && (
                          <span className="text-orange-600 text-xs shrink-0">⚠️</span>
                        )}
                        <p className="text-sm truncate">{command.name}</p>
                      </div>
                      <span className="text-xs text-gray-600 ml-2 shrink-0">
                        单 <span className="text-blue-600">{command.sessionCount}</span> 次
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!canStartTraining() && selectedCommands.length > 0 && (
        <Alert>
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-sm">
            请确保至少有一个指令的单次播放次数大于0，且所有指令都已录音
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={onStartTraining}
        disabled={!canStartTraining()}
        className="w-full"
        size="lg"
      >
        <Play className="w-5 h-5 mr-2" />
        开始训练
      </Button>
    </div>
  );
}
