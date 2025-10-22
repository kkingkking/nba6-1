import { Command } from '../App';

// 将Blob转换为base64字符串
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 将base64字符串转换为Blob
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// 保存指令数据（包含音频）
export async function saveCommands(commands: Command[]): Promise<void> {
  const commandsToSave = await Promise.all(
    commands.map(async (cmd) => {
      if (cmd.audioBlob) {
        const base64 = await blobToBase64(cmd.audioBlob);
        return {
          id: cmd.id,
          name: cmd.name,
          trainingCount: cmd.trainingCount,
          sessionCount: cmd.sessionCount,
          order: cmd.order,
          groupId: cmd.groupId,
          selected: cmd.selected,
          audioBase64: base64,
        };
      }
      return {
        id: cmd.id,
        name: cmd.name,
        trainingCount: cmd.trainingCount,
        sessionCount: cmd.sessionCount,
        order: cmd.order,
        groupId: cmd.groupId,
        selected: cmd.selected,
      };
    })
  );

  localStorage.setItem('basketball-commands', JSON.stringify(commandsToSave));
}

// 加载指令数据（包含音频）
export function loadCommands(): Command[] {
  const saved = localStorage.getItem('basketball-commands');
  if (!saved) return [];

  const commandsData = JSON.parse(saved);
  
  return commandsData.map((data: any) => {
    if (data.audioBase64) {
      const audioBlob = base64ToBlob(data.audioBase64);
      const audioUrl = URL.createObjectURL(audioBlob);
      return {
        id: data.id,
        name: data.name,
        trainingCount: data.trainingCount || 0,
        sessionCount: data.sessionCount !== undefined ? data.sessionCount : 1, // 兼容旧数据，默认为1
        order: data.order || 0,
        groupId: data.groupId,
        selected: data.selected || false,
        audioBlob,
        audioUrl,
      };
    }
    return {
      id: data.id,
      name: data.name,
      trainingCount: data.trainingCount || 0,
      sessionCount: data.sessionCount !== undefined ? data.sessionCount : 1, // 兼容旧数据，默认为1
      order: data.order || 0,
      groupId: data.groupId,
      selected: data.selected || false,
    };
  });
}
