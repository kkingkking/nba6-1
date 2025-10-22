import { useState, useEffect } from "react";
import { CommandManager } from "./components/CommandManager";
import { TrainingConfig } from "./components/TrainingConfig";
import { TrainingSession } from "./components/TrainingSession";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Activity } from "lucide-react";
import { loadCommands, saveCommands } from "./utils/storage";

export interface Command {
  id: string;
  name: string;
  audioBlob?: Blob;
  audioUrl?: string;
  trainingCount: number; // 累计训练次数（历史统计）
  sessionCount: number; // 单次训练播放次数
  order: number; // 排序顺序
  groupId?: string; // 所属分组ID
  selected: boolean; // 是否选中（用于批量操作）
}

export interface Group {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface CommandConfig {
  commandId: string;
  count: number; // 训练中出现次数
}

export interface TrainingSettings {
  duration: number; // 训练总时长（秒）
  minBreakTime: number; // 指令间最小间隔
  maxBreakTime: number; // 指令间最大间隔
  commandConfigs: CommandConfig[];
}

export interface TrainingPreset {
  id: string;
  name: string;
  description?: string;
  sessionCounts: { [commandId: string]: number }; // 每个指令的单次训练次数
  createdAt: number;
}

// 应用版本
const APP_VERSION = "v32";

export default function App() {
  // 从localStorage加载数据
  const [commands, setCommands] = useState<Command[]>(() =>
    loadCommands(),
  );

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem("basketball-groups");
    return saved ? JSON.parse(saved) : [];
  });

  const [trainingSettings, setTrainingSettings] =
    useState<TrainingSettings>(() => {
      const saved = localStorage.getItem("basketball-settings");
      return saved
        ? JSON.parse(saved)
        : {
            duration: 300, // 默认5分钟
            minBreakTime: 5,
            maxBreakTime: 30,
            commandConfigs: [],
          };
    });

  const [isTraining, setIsTraining] = useState(false);

  const [trainingPresets, setTrainingPresets] = useState<TrainingPreset[]>(() => {
    const saved = localStorage.getItem("basketball-presets");
    return saved ? JSON.parse(saved) : [];
  });

  // 保存commands到localStorage（异步，包含音频）
  useEffect(() => {
    saveCommands(commands);
  }, [commands]);

  // 保存groups到localStorage
  useEffect(() => {
    localStorage.setItem("basketball-groups", JSON.stringify(groups));
  }, [groups]);

  // 保存trainingSettings到localStorage
  useEffect(() => {
    localStorage.setItem(
      "basketball-settings",
      JSON.stringify(trainingSettings),
    );
  }, [trainingSettings]);

  // 保存trainingPresets到localStorage
  useEffect(() => {
    localStorage.setItem("basketball-presets", JSON.stringify(trainingPresets));
  }, [trainingPresets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-3">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-orange-500 p-2.5 rounded-full">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-orange-600 text-xl">篮球训练助手</h1>
            </div>
          </div>
          <span className="text-xs text-gray-500">{APP_VERSION}</span>
        </div>

        {!isTraining ? (
          <Tabs defaultValue="commands" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="commands" className="text-sm">
                指令管理
              </TabsTrigger>
              <TabsTrigger value="training" className="text-sm">
                训练设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commands">
              <CommandManager
                commands={commands}
                setCommands={setCommands}
                groups={groups}
                setGroups={setGroups}
                trainingPresets={trainingPresets}
                setTrainingPresets={setTrainingPresets}
              />
            </TabsContent>

            <TabsContent value="training">
              <TrainingConfig
                commands={commands}
                trainingSettings={trainingSettings}
                setTrainingSettings={setTrainingSettings}
                onStartTraining={() => setIsTraining(true)}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <TrainingSession
            commands={commands}
            trainingSettings={trainingSettings}
            onEndTraining={() => setIsTraining(false)}
            setCommands={setCommands}
          />
        )}
      </div>
    </div>
  );
}