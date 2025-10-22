import { useState, useEffect } from 'react';
import { Command, Group, TrainingPreset } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Mic, Square, Play, Trash2, Plus, GripVertical, Edit2, Check, X, FolderPlus, Folder, CheckSquare, Square as SquareIcon, Save, BookmarkPlus, Bookmark, AlertCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface CommandManagerProps {
  commands: Command[];
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  trainingPresets: TrainingPreset[];
  setTrainingPresets: React.Dispatch<React.SetStateAction<TrainingPreset[]>>;
}

interface SortableCommandItemProps {
  command: Command;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayAudio: () => void;
  onDelete: () => void;
  onUpdateSessionCount: (count: number) => void;
  onToggleSelect: () => void;
  onEditGroup: () => void;
  groupColor?: string;
  groups: Group[];
}

const GROUP_COLORS = [
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
  { value: 'pink', label: '粉色', class: 'bg-pink-500' },
  { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'indigo', label: '靛蓝', class: 'bg-indigo-500' },
  { value: 'orange', label: '橙色', class: 'bg-orange-500' },
];

interface SortableGroupHeaderProps {
  group: Group | null;
  groupCommands: Command[];
  groupSelectedCount: number;
  onSelectAll: () => void;
  onBatchSetSessionCount: (count: number) => void;
}

function SortableGroupHeader({
  group,
  groupCommands,
  groupSelectedCount,
  onSelectAll,
  onBatchSetSessionCount,
}: SortableGroupHeaderProps) {
  // 只有真实的分组才可拖拽
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group?.id || 'ungrouped', disabled: !group });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getGroupColorClass = (color: string) => {
    const colorObj = GROUP_COLORS.find(c => c.value === color);
    return colorObj?.class || 'bg-gray-500';
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        {group ? (
          <>
            <div className={`w-2 h-2 rounded-full ${getGroupColorClass(group.color)}`} />
            <button
              onClick={onSelectAll}
              className="flex items-center gap-1.5 hover:text-blue-600 text-sm"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{group.name}</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-xs">{groupCommands.length}</Badge>
              {groupSelectedCount > 0 && (
                <Badge variant="default" className="h-4 px-1.5 text-xs">{groupSelectedCount}</Badge>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>未分组</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-xs">{groupCommands.length}</Badge>
            {groupSelectedCount > 0 && (
              <Badge variant="default" className="h-4 px-1.5 text-xs">{groupSelectedCount}</Badge>
            )}
          </button>
        )}
      </div>
      
      {/* 分组快捷批量设置 */}
      <div className="flex items-center gap-1">
        {[1, 3, 5, 10].map(num => (
          <Button
            key={num}
            onClick={() => onBatchSetSessionCount(num)}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            {num}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SortableCommandItem({
  command,
  isRecording,
  onStartRecording,
  onStopRecording,
  onPlayAudio,
  onDelete,
  onUpdateSessionCount,
  onToggleSelect,
  onEditGroup,
  groupColor,
  groups,
}: SortableCommandItemProps) {
  const [isEditingCount, setIsEditingCount] = useState(false);
  const [editCount, setEditCount] = useState(command.sessionCount.toString());

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: command.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveCount = () => {
    const count = parseInt(editCount) || 0;
    onUpdateSessionCount(Math.max(0, count));
    setIsEditingCount(false);
  };

  const handleCancelEdit = () => {
    setEditCount(command.sessionCount.toString());
    setIsEditingCount(false);
  };

  const getGroupColorClass = (color?: string) => {
    const colorObj = GROUP_COLORS.find(c => c.value === color);
    return colorObj?.class || 'bg-gray-500';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
        command.selected ? 'bg-blue-50 border-blue-300' : 'bg-white'
      }`}
    >
      {/* 选择框 */}
      <Checkbox
        checked={command.selected}
        onCheckedChange={onToggleSelect}
      />

      {/* 分组标识 */}
      {groupColor && (
        <div className={`w-1 h-10 rounded ${getGroupColorClass(groupColor)}`} />
      )}

      {/* 拖拽手柄 */}
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* 指令信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="truncate">{command.name}</p>
          <Button
            onClick={onEditGroup}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 shrink-0"
            title="编辑指令"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {command.audioUrl ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-orange-600">⚠️</span>
          )}
          {isEditingCount ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editCount}
                onChange={(e) => setEditCount(e.target.value)}
                className="w-12 h-5 text-xs px-1"
                min="0"
                autoFocus
              />
              <Button
                onClick={handleSaveCount}
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
              >
                <Check className="w-3 h-3 text-green-600" />
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
              >
                <X className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingCount(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              单{command.sessionCount}次
            </button>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">总{command.trainingCount}次</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 shrink-0">
        {isRecording ? (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            size="sm"
            className="h-8 px-2"
            title="停止录音"
          >
            <Square className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            onClick={onStartRecording}
            variant="outline"
            size="sm"
            className="h-8 px-2"
            title={command.audioUrl ? "重新录音" : "开始录音"}
          >
            <Mic className="w-3 h-3" />
          </Button>
        )}

        {command.audioUrl && (
          <Button
            onClick={onPlayAudio}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Play className="w-3 h-3" />
          </Button>
        )}

        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export function CommandManager({ commands, setCommands, groups, setGroups, trainingPresets, setTrainingPresets }: CommandManagerProps) {
  const [newCommandName, setNewCommandName] = useState('');
  const [newCommandGroup, setNewCommandGroup] = useState<string>('');
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);
  const [recordingCommandId, setRecordingCommandId] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // 分组相关状态
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // 批量操作相关状态
  const [batchCount, setBatchCount] = useState('1');
  const [showBatchTools, setShowBatchTools] = useState(false);
  
  // 编辑指令分组状态
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [editCommandGroup, setEditCommandGroup] = useState<string>('');
  const [editCommandName, setEditCommandName] = useState<string>('');

  // 训练方案相关状态
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [showPresetList, setShowPresetList] = useState(false);
  
  // 权限帮助对话框
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addCommand = () => {
    if (newCommandName.trim()) {
      const newCommand: Command = {
        id: Date.now().toString(),
        name: newCommandName.trim(),
        trainingCount: 0, // 历史统计
        sessionCount: 1, // 单次训练默认1次
        order: commands.length,
        groupId: newCommandGroup && newCommandGroup !== 'none' ? newCommandGroup : undefined,
        selected: false,
      };
      setCommands([...commands, newCommand]);
      setNewCommandName('');
      setNewCommandGroup('');
      setIsCommandDialogOpen(false);
    }
  };

  const deleteCommand = (id: string) => {
    setCommands(commands.filter(cmd => cmd.id !== id));
  };

  const updateSessionCount = (id: string, count: number) => {
    setCommands(commands.map(cmd =>
      cmd.id === id ? { ...cmd, sessionCount: count } : cmd
    ));
  };

  const toggleCommandSelect = (id: string) => {
    setCommands(commands.map(cmd =>
      cmd.id === id ? { ...cmd, selected: !cmd.selected } : cmd
    ));
  };

  const selectAllInGroup = (groupId: string | undefined) => {
    const groupCommands = commands.filter(cmd => cmd.groupId === groupId);
    const allSelected = groupCommands.every(cmd => cmd.selected);
    
    setCommands(commands.map(cmd =>
      cmd.groupId === groupId ? { ...cmd, selected: !allSelected } : cmd
    ));
  };

  const selectAll = () => {
    const allSelected = commands.every(cmd => cmd.selected);
    setCommands(commands.map(cmd => ({ ...cmd, selected: !allSelected })));
  };

  const batchSetSessionCount = () => {
    const count = parseInt(batchCount) || 0;
    setCommands(commands.map(cmd =>
      cmd.selected ? { ...cmd, sessionCount: Math.max(0, count) } : cmd
    ));
    setBatchCount('1');
    setShowBatchTools(false);
  };

  const batchSetSessionCountForGroup = (groupId: string | undefined, count: number) => {
    setCommands(commands.map(cmd =>
      cmd.groupId === groupId ? { ...cmd, sessionCount: Math.max(0, count) } : cmd
    ));
  };

  const updateCommandGroup = (commandId: string, newGroupId: string) => {
    setCommands(commands.map(cmd =>
      cmd.id === commandId 
        ? { ...cmd, groupId: newGroupId === 'none' ? undefined : newGroupId } 
        : cmd
    ));
    setEditingCommandId(null);
    setEditCommandGroup('');
  };

  const updateCommand = (commandId: string, newName: string, newGroupId: string) => {
    setCommands(commands.map(cmd =>
      cmd.id === commandId 
        ? { ...cmd, name: newName.trim(), groupId: newGroupId === 'none' ? undefined : newGroupId } 
        : cmd
    ));
    setEditingCommandId(null);
    setEditCommandGroup('');
    setEditCommandName('');
  };

  // 保存当前训练方案
  const savePreset = () => {
    if (!presetName.trim()) return;

    const sessionCounts: { [key: string]: number } = {};
    commands.forEach(cmd => {
      sessionCounts[cmd.id] = cmd.sessionCount;
    });

    const newPreset: TrainingPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      description: presetDescription.trim(),
      sessionCounts,
      createdAt: Date.now(),
    };

    setTrainingPresets([...trainingPresets, newPreset]);
    setPresetName('');
    setPresetDescription('');
    setIsPresetDialogOpen(false);
  };

  // 应用训练方案
  const applyPreset = (preset: TrainingPreset) => {
    setCommands(commands.map(cmd => ({
      ...cmd,
      sessionCount: preset.sessionCounts[cmd.id] ?? cmd.sessionCount,
    })));
    setShowPresetList(false);
  };

  // 删除训练方案
  const deletePreset = (presetId: string) => {
    setTrainingPresets(trainingPresets.filter(p => p.id !== presetId));
  };



  // 检测设备类型
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isMobile = isAndroid || isIOS;
    
    return { isAndroid, isIOS, isMobile };
  };

  // 获取浏览器类型和设置指导
  const getBrowserHelp = () => {
    const ua = navigator.userAgent;
    const { isAndroid, isIOS, isMobile } = getDeviceType();
    
    if (ua.includes('Chrome') && !ua.includes('Edge')) {
      return {
        name: 'Chrome',
        isMobile: isMobile,
        browserSteps: [
          '1️⃣ 点击地址栏左侧的 🔒 锁图标',
          '2️⃣ 找到"麦克风"选项',
          '3️⃣ 点击下拉菜单，选择"允许"',
          '4️⃣ 点击下方的"刷新页面"按钮'
        ],
        systemSteps: isAndroid ? [
          '📱 如果浏览器设置无效，检查系统设置：',
          '1️⃣ 打开手机的"设置"',
          '2️⃣ 选择"应用" → "Chrome"',
          '3️⃣ 选择"权限" → "麦克风"',
          '4️⃣ 选择"允许"',
          '5️⃣ 返回浏览器，刷新页面'
        ] : []
      };
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return {
        name: 'Safari',
        isMobile: isMobile,
        browserSteps: isIOS ? [
          '1️⃣ 点击地址栏左侧的 "AA" 图标',
          '2️⃣ 选择"网站设置"',
          '3️⃣ 找到"麦克风"，选择"允许"',
          '4️⃣ 点击下方的"刷新页面"按钮'
        ] : [
          '1️⃣ 点击地址栏左侧的图标',
          '2️⃣ 找到麦克风权限设置',
          '3️⃣ 选择"允许"',
          '4️⃣ 点击下方的"刷新页面"按钮'
        ],
        systemSteps: isIOS ? [
          '📱 如果浏览器设置无效，检查系统设置：',
          '1️⃣ 打开 iPhone 的"设置"',
          '2️⃣ 下滑找到"Safari"',
          '3️⃣ 点击"麦克风"',
          '4️⃣ 确保开关是打开状态',
          '或者：',
          '1️⃣ 设置 → 隐私与安全性',
          '2️⃣ 点击"麦克风"',
          '3️⃣ 确保 Safari 的开关是打开的',
          '4️⃣ 返回浏览器，刷新页面'
        ] : []
      };
    } else if (ua.includes('Firefox')) {
      return {
        name: 'Firefox',
        isMobile: isMobile,
        browserSteps: [
          '1️⃣ 点击地址栏左侧的 🔒 锁图标',
          '2️⃣ 点击"权限"旁边的 > 箭头',
          '3️⃣ 找到"使用麦克风"',
          '4️⃣ 选择"允许"',
          '5️⃣ 点击下方的"刷新页面"按钮'
        ],
        systemSteps: isAndroid ? [
          '📱 如果浏览器设置无效，检查系统设置：',
          '1️⃣ 打开手机的"设置"',
          '2️⃣ 选择"应用" → "Firefox"',
          '3️⃣ 选择"权限" → "麦克风"',
          '4️⃣ 选择"允许"',
          '5️⃣ 返回浏览器，刷新页面'
        ] : []
      };
    } else if (ua.includes('Edge')) {
      return {
        name: 'Edge',
        isMobile: isMobile,
        browserSteps: [
          '1️⃣ 点击地址栏左侧的 🔒 锁图标',
          '2️⃣ 找到"麦克风"选项',
          '3️⃣ 选择"允许"',
          '4️⃣ 点击下方的"刷新页面"按钮'
        ],
        systemSteps: []
      };
    }
    return {
      name: '浏览器',
      isMobile: isMobile,
      browserSteps: [
        '1️⃣ 点击地址栏左侧的图标',
        '2️⃣ 找到麦克风权限设置',
        '3️⃣ 选择"允许"',
        '4️⃣ 点击下方的"刷新页面"按钮'
      ],
      systemSteps: []
    };
  };

  const addGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        color: newGroupColor,
        order: groups.length,
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setNewGroupColor('blue');
      setIsGroupDialogOpen(false);
    }
  };

  const deleteGroup = (groupId: string) => {
    // 删除分组时，将该分组的指令移到未分组
    setCommands(commands.map(cmd =>
      cmd.groupId === groupId ? { ...cmd, groupId: undefined } : cmd
    ));
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const updateGroupName = (groupId: string, name: string) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    ));
    setEditingGroupId(null);
  };

  const startRecording = async (commandId: string) => {
    try {
      setRecordingError(null);
      
      // 检查浏览器是否支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError('您的浏览器不支持录音功能。请使用 Chrome、Firefox 或 Safari 等现代浏览器。');
        return;
      }

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 尝试使用浏览器支持的音频格式
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/mp4' };
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: '' }; // 使用默认格式
        }
      }
      
      const recorder = new MediaRecorder(stream, options.mimeType ? options : undefined);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setCommands(prevCommands => prevCommands.map(cmd =>
          cmd.id === commandId
            ? { ...cmd, audioBlob, audioUrl }
            : cmd
        ));

        stream.getTracks().forEach(track => track.stop());
        setRecordingCommandId(null);
        setMediaRecorder(null);
      };

      recorder.onerror = (event) => {
        console.error('录音错误:', event);
        setRecordingError('录音过程中出现错误，请重试。');
        stream.getTracks().forEach(track => track.stop());
        setRecordingCommandId(null);
        setMediaRecorder(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingCommandId(commandId);
    } catch (error: any) {
      console.error('录音启动失败:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setRecordingError('麦克风权限被拒绝。请点击地址栏左侧的图标，允许麦克风权限，然后刷新页面重试。');
        setIsHelpDialogOpen(true);
      } else if (error.name === 'NotFoundError') {
        setRecordingError('未找到麦克风设备。请确保您的设备连接了麦克风。');
      } else {
        setRecordingError('无法访问麦克风：' + (error.message || '未知错误'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 检查是否是指令拖拽（确保active和over都是指令ID）
      const activeCommand = commands.find(cmd => cmd.id === active.id);
      const overCommand = commands.find(cmd => cmd.id === over.id);
      
      if (activeCommand && overCommand) {
        const oldIndex = commands.findIndex(cmd => cmd.id === active.id);
        const newIndex = commands.findIndex(cmd => cmd.id === over.id);

        const newCommands = arrayMove(commands, oldIndex, newIndex);
        // 更新order字段
        const updatedCommands = newCommands.map((cmd, index) => ({
          ...cmd,
          order: index,
        }));
        setCommands(updatedCommands);
      }
    }
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 检查是否是分组拖拽（确保active和over都是分组ID）
      const activeGroup = groups.find(g => g.id === active.id);
      const overGroup = groups.find(g => g.id === over.id);
      
      if (activeGroup && overGroup) {
        const oldIndex = groups.findIndex(g => g.id === active.id);
        const newIndex = groups.findIndex(g => g.id === over.id);

        const newGroups = arrayMove(groups, oldIndex, newIndex);
        // 更新order字段
        const updatedGroups = newGroups.map((grp, index) => ({
          ...grp,
          order: index,
        }));
        setGroups(updatedGroups);
      }
    }
  };

  // 按order排序
  const sortedCommands = [...commands].sort((a, b) => a.order - b.order);
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  // 按分组组织指令
  const commandsByGroup = new Map<string | undefined, Command[]>();
  sortedCommands.forEach(cmd => {
    const groupId = cmd.groupId;
    if (!commandsByGroup.has(groupId)) {
      commandsByGroup.set(groupId, []);
    }
    commandsByGroup.get(groupId)!.push(cmd);
  });

  // 按分组order排序显示
  const groupedEntries: Array<[string | undefined, Command[]]> = [];
  
  // 先添加已排序的分组
  sortedGroups.forEach(group => {
    if (commandsByGroup.has(group.id)) {
      groupedEntries.push([group.id, commandsByGroup.get(group.id)!]);
    }
  });
  
  // 最后添加未分组
  if (commandsByGroup.has(undefined)) {
    groupedEntries.push([undefined, commandsByGroup.get(undefined)!]);
  }

  const selectedCount = commands.filter(cmd => cmd.selected).length;

  const getGroupColorClass = (color: string) => {
    const colorObj = GROUP_COLORS.find(c => c.value === color);
    return colorObj?.class || 'bg-gray-500';
  };

  const browserHelp = getBrowserHelp();

  return (
    <div className="space-y-3">
      {/* 使用提示 */}
      {commands.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <p className="text-sm">👋 <span className="text-blue-900">欢迎使用篮球训练助手</span></p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>1️⃣ 点击下方"添加指令"，创建训练动作（如：投篮、突破、转身）</p>
                <p>2️⃣ 点击麦克风按钮为每个指令录制语音</p>
                <p>3️⃣ 勾选要训练的指令，设置播放次数</p>
                <p>4️⃣ 切换到"训练设置"标签，开始随机训练</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 录音错误提示 */}
      {recordingError && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-sm">{recordingError}</span>
            {recordingError.includes('权限') && (
              <Button
                onClick={() => setIsHelpDialogOpen(true)}
                size="sm"
                variant="outline"
                className="h-7 shrink-0"
              >
                查看帮助
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 批量操作工具栏 */}
      {selectedCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">已选 {selectedCount} 个</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowBatchTools(!showBatchTools)}
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  批量设置
                </Button>
                <Button
                  onClick={selectAll}
                  variant="ghost"
                  size="sm"
                  className="h-7"
                >
                  取消
                </Button>
              </div>
            </div>
            
            {showBatchTools && (
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  className="w-16 h-7 text-sm"
                  min="0"
                  placeholder="1"
                />
                <Button onClick={batchSetSessionCount} size="sm" className="h-7">
                  应用
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 训练方案管理 */}
      {commands.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bookmark className="w-4 h-4 text-purple-600" />
                训练方案
              </CardTitle>
              <div className="flex gap-2">
                <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7">
                      <Save className="w-3 h-3 mr-1" />
                      <span className="text-xs">保存</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>保存训练方案</DialogTitle>
                      <DialogDescription>
                        保存当前所有指令的单次训练播放次数配置
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>方案名称</Label>
                        <Input
                          placeholder="例如：基础训练、强化训练"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>方案说明（可选）</Label>
                        <Textarea
                          placeholder="例如：适合日常训练使用"
                          value={presetDescription}
                          onChange={(e) => setPresetDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={savePreset} disabled={!presetName.trim()}>
                        保存方案
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {trainingPresets.length > 0 && (
                  <Button 
                    onClick={() => setShowPresetList(!showPresetList)}
                    variant={showPresetList ? "default" : "outline"}
                    size="sm"
                    className="h-7"
                  >
                    <BookmarkPlus className="w-3 h-3 mr-1" />
                    <span className="text-xs">方案 ({trainingPresets.length})</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {showPresetList && trainingPresets.length > 0 && (
            <CardContent className="pt-3">
              <div className="space-y-2">
                {trainingPresets.map(preset => (
                  <div 
                    key={preset.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate">{preset.name}</p>
                        <Badge variant="secondary" className="text-xs h-4 px-1.5 shrink-0">
                          {Object.keys(preset.sessionCounts).length}
                        </Badge>
                      </div>
                      {preset.description && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{preset.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        onClick={() => applyPreset(preset)}
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-xs"
                      >
                        应用
                      </Button>
                      <Button
                        onClick={() => deletePreset(preset.id)}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 分组管理 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">指令分组</CardTitle>
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7">
                  <FolderPlus className="w-3 h-3 mr-1" />
                  <span className="text-xs">新建</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新建分组</DialogTitle>
                  <DialogDescription>为你的训练指令创建一个新分组</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>分组名称</Label>
                    <Input
                      placeholder="例如：基础动作、进阶技巧"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>分组颜色</Label>
                    <Select value={newGroupColor} onValueChange={setNewGroupColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addGroup}>创建分组</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        {groups.length > 0 && (
          <CardContent className="pt-3">
            <div className="flex flex-wrap gap-1.5">
              {groups.map(group => (
                <div key={group.id} className="flex items-center gap-1.5 p-1.5 border rounded bg-white">
                  <div className={`w-2 h-2 rounded-full ${getGroupColorClass(group.color)}`} />
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="h-5 w-20 text-xs px-1"
                        autoFocus
                        onBlur={() => {
                          if (editGroupName.trim()) {
                            updateGroupName(group.id, editGroupName);
                          } else {
                            setEditingGroupId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editGroupName.trim()) {
                            updateGroupName(group.id, editGroupName);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => selectAllInGroup(group.id)}
                        className="text-xs hover:text-blue-600"
                      >
                        {group.name}
                      </button>
                      <Badge variant="secondary" className="h-4 px-1 text-xs">
                        {commands.filter(cmd => cmd.groupId === group.id).length}
                      </Badge>
                    </>
                  )}
                  <Button
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditGroupName(group.name);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </Button>
                  <Button
                    onClick={() => deleteGroup(group.id)}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 指令列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">训练指令列表</CardTitle>
            <Button
              onClick={selectAll}
              variant="ghost"
              size="sm"
              className="h-7"
            >
              {commands.every(cmd => cmd.selected) ? (
                <>
                  <SquareIcon className="w-3 h-3 mr-1" />
                  <span className="text-xs">取消</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3 h-3 mr-1" />
                  <span className="text-xs">全选</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-4">
            {groupedEntries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                暂无训练指令，请添加指令开始使用
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleGroupDragEnd}
              >
                <SortableContext
                  items={sortedGroups.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {groupedEntries.map(([groupId, groupCommands]) => {
                    const group = groups.find(g => g.id === groupId);
                    const groupSelectedCount = groupCommands.filter(cmd => cmd.selected).length;
                    
                    return (
                      <div key={groupId || 'ungrouped'} className="space-y-2 mb-4">
                        {/* 分组标题（可拖动） */}
                        {group && (
                          <SortableGroupHeader
                            group={group}
                            groupCommands={groupCommands}
                            groupSelectedCount={groupSelectedCount}
                            onSelectAll={() => selectAllInGroup(groupId)}
                            onBatchSetSessionCount={(count) => batchSetSessionCountForGroup(groupId, count)}
                          />
                        )}
                        
                        {/* 未分组标题（不可拖动） */}
                        {!group && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => selectAllInGroup(undefined)}
                                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm"
                              >
                                <Folder className="w-3.5 h-3.5" />
                                <span>未分组</span>
                                <Badge variant="secondary" className="h-4 px-1.5 text-xs">{groupCommands.length}</Badge>
                                {groupSelectedCount > 0 && (
                                  <Badge variant="default" className="h-4 px-1.5 text-xs">{groupSelectedCount}</Badge>
                                )}
                              </button>
                            </div>
                            
                            {/* 分组快捷批量设置 */}
                            <div className="flex items-center gap-1">
                              {[1, 3, 5, 10].map(num => (
                                <Button
                                  key={num}
                                  onClick={() => batchSetSessionCountForGroup(groupId, num)}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                >
                                  {num}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* 分组内的指令 */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={groupCommands.map(cmd => cmd.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {groupCommands.map((command) => (
                            <SortableCommandItem
                              key={command.id}
                              command={command}
                              isRecording={recordingCommandId === command.id}
                              onStartRecording={() => startRecording(command.id)}
                              onStopRecording={stopRecording}
                              onPlayAudio={() => playAudio(command.audioUrl!)}
                              onDelete={() => deleteCommand(command.id)}
                              onUpdateSessionCount={(count) => updateSessionCount(command.id, count)}
                              onToggleSelect={() => toggleCommandSelect(command.id)}
                              onEditGroup={() => {
                                setEditingCommandId(command.id);
                                setEditCommandGroup(command.groupId || 'none');
                                setEditCommandName(command.name);
                              }}
                              groupColor={group?.color}
                              groups={groups}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  );
                })}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <Dialog open={isCommandDialogOpen} onOpenChange={setIsCommandDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-3">
                <Plus className="w-4 h-4 mr-2" />
                添加指令
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新指令</DialogTitle>
                <DialogDescription>
                  输入训练指令名称，如"投篮"、"突破"、"转身"等
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>指令名称</Label>
                  <Input
                    placeholder="指令名称"
                    value={newCommandName}
                    onChange={(e) => setNewCommandName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCommand()}
                  />
                </div>
                {groups.length > 0 && (
                  <div className="space-y-2">
                    <Label>所属分组（可选）</Label>
                    <Select value={newCommandGroup} onValueChange={setNewCommandGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分组或留空" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无分组</SelectItem>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getGroupColorClass(group.color)}`} />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={addCommand}>添加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 编辑指令对话框 */}
          <Dialog open={editingCommandId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingCommandId(null);
              setEditCommandGroup('');
              setEditCommandName('');
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑指令</DialogTitle>
                <DialogDescription>
                  修改指令名称和所属分组
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>指令名称</Label>
                  <Input
                    value={editCommandName}
                    onChange={(e) => setEditCommandName(e.target.value)}
                    placeholder="指令名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>所属分组</Label>
                  <Select value={editCommandGroup} onValueChange={setEditCommandGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分组" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无分组</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getGroupColorClass(group.color)}`} />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setEditingCommandId(null);
                  setEditCommandGroup('');
                  setEditCommandName('');
                }}>
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    if (editingCommandId && editCommandName.trim()) {
                      updateCommand(editingCommandId, editCommandName, editCommandGroup);
                    }
                  }}
                  disabled={!editCommandName.trim()}
                >
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 麦克风权限帮助对话框 */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Mic className="w-5 h-5 text-orange-600" />
              麦克风权限解决方案
            </DialogTitle>
            <DialogDescription>
              请按照以下步骤允许麦克风权限
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 浏览器设置步骤 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-sm">🌐 {browserHelp.name} 浏览器设置</span>
              </div>
              <div className="space-y-2 pl-2">
                {browserHelp.browserSteps.map((step, index) => (
                  <p key={index} className="text-sm text-gray-700 leading-relaxed">
                    {step}
                  </p>
                ))}
              </div>
            </div>

            {/* 系统设置步骤（仅移动端） */}
            {browserHelp.systemSteps.length > 0 && (
              <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="space-y-2">
                  {browserHelp.systemSteps.map((step, index) => (
                    <p key={index} className="text-sm text-gray-700 leading-relaxed">
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 快速操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => {
                  setIsHelpDialogOpen(false);
                  setRecordingError(null);
                }} 
                size="sm"
                variant="outline"
                className="flex-1"
              >
                知道了
              </Button>
              <Button 
                onClick={() => {
                  window.location.reload();
                }} 
                size="sm"
                className="flex-1"
              >
                🔄 刷新页面
              </Button>
            </div>

            {/* HTTPS 提示 */}
            {!window.location.protocol.includes('https') && window.location.hostname !== 'localhost' && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  ⚠️ 当前网站未使用 HTTPS，浏览器可能阻止麦克风访问。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
