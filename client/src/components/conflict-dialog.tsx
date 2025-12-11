import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { Event, Task } from "@shared/schema";

export interface ConflictItem {
  type: "event" | "task";
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
}

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictItem[];
  onConfirm: () => void;
  itemType: "evento" | "tarefa";
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onConfirm,
  itemType,
}: ConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Conflito de Horário Detectado
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Já existe(m) compromisso(s) marcado(s) para este horário. Deseja
                criar {itemType === "evento" ? "o evento" : "a tarefa"} mesmo assim?
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">
                          {conflict.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {conflict.type === "event" ? "Evento" : "Tarefa"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(conflict.date)}</span>
                        </div>
                        {(conflict.startTime || conflict.endTime) && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(conflict.startTime)}
                              {conflict.endTime && ` - ${formatTime(conflict.endTime)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-conflict">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
            data-testid="button-confirm-conflict"
          >
            Criar Mesmo Assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Função utilitária para verificar conflitos de horário
export function checkTimeConflict(
  newDate: string,
  newStartTime: string | null | undefined,
  newEndTime: string | null | undefined,
  events: Event[],
  tasks: Task[],
  excludeEventId?: number,
  excludeTaskId?: number
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  // Função para converter time string em minutos para comparação
  const timeToMinutes = (time: string | null | undefined): number | null => {
    if (!time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Função para verificar sobreposição de horários
  const hasTimeOverlap = (
    start1: number | null,
    end1: number | null,
    start2: number | null,
    end2: number | null
  ): boolean => {
    // Se algum dos horários não tem tempo definido, considera conflito por ser mesmo dia
    if (start1 === null || start2 === null) {
      return true; // Mesmo dia sem horário específico = possível conflito
    }

    // Se não tem hora fim, considera que dura 1 hora (60 minutos)
    const effectiveEnd1 = end1 ?? start1 + 60;
    const effectiveEnd2 = end2 ?? start2 + 60;

    // Verifica sobreposição: início1 < fim2 E início2 < fim1
    return start1 < effectiveEnd2 && start2 < effectiveEnd1;
  };

  const newStart = timeToMinutes(newStartTime);
  const newEnd = timeToMinutes(newEndTime);

  // Verificar conflitos com eventos
  events.forEach((event) => {
    if (excludeEventId && event.id === excludeEventId) return;
    
    if (event.startDate === newDate) {
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);

      if (hasTimeOverlap(newStart, newEnd, eventStart, eventEnd)) {
        conflicts.push({
          type: "event",
          title: event.title,
          date: event.startDate,
          startTime: event.startTime,
          endTime: event.endTime,
        });
      }
    }
  });

  // Verificar conflitos com tarefas (tarefas só têm data, não horário)
  // Só verifica se o novo item não tem horário específico ou se é uma tarefa
  if (newStart === null) {
    tasks.forEach((task) => {
      if (excludeTaskId && task.id === excludeTaskId) return;
      
      if (task.dueDate === newDate) {
        conflicts.push({
          type: "task",
          title: task.title,
          date: task.dueDate,
          startTime: null,
          endTime: null,
        });
      }
    });
  }

  return conflicts;
}
