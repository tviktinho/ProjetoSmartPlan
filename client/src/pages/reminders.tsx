import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle2, Circle, Bell, BellOff, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Reminder } from "@shared/schema";
import { ReminderDialog } from "@/components/reminder-dialog";
import { useToast } from "@/hooks/use-toast";

// Função para parsear data no formato YYYY-MM-DD como data local (não UTC)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Função para criar datetime combinando data e hora
function parseLocalDateTime(dateStr: string, timeStr?: string | null): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }
  return new Date(year, month - 1, day, 23, 59, 59); // Fim do dia se não houver hora
}

// Intervalos de notificação em minutos
const NOTIFICATION_INTERVALS = [15, 5, 3, 1];

function RemindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Rastrear notificações já enviadas para evitar duplicatas
  const notifiedReminders = useRef<Set<string>>(new Set());

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const response = await fetch("/api/reminders");
      if (!response.ok) throw new Error("Erro ao carregar lembretes");
      return response.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["/api/disciplines"],
    queryFn: async () => {
      const response = await fetch("/api/disciplines");
      if (!response.ok) throw new Error("Erro ao carregar disciplinas");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar lembrete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({ title: "Sucesso", description: "Lembrete deletado" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (reminder: Reminder) => {
      const newStatus = reminder.status === "completed" ? "pending" : "completed";
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === "completed" ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status");
      return response.json();
    },
    onSuccess: (_, reminder) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      const newStatus = reminder.status === "completed" ? "pendente" : "concluído";
      toast({ 
        title: "Status atualizado", 
        description: `Lembrete marcado como ${newStatus}` 
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá alertas para seus lembretes.",
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "Ative as notificações nas configurações do navegador.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Verificar permissão de notificação ao carregar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  // Enviar notificação
  const sendNotification = useCallback((title: string, body: string, tag: string) => {
    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.png",
        tag, // Evita notificações duplicadas com o mesmo tag
        requireInteraction: true,
      });
    }
  }, [notificationsEnabled]);

  // Sistema de verificação de status e notificações
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      reminders.forEach((reminder: Reminder) => {
        if (reminder.status === "completed") return;

        const dueDateTime = parseLocalDateTime(reminder.dueDate, reminder.dueTime);
        const diffMs = dueDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        // Verificar se está atrasado e atualizar status
        if (diffMs < 0 && reminder.status === "pending") {
          updateStatusMutation.mutate({ id: reminder.id, status: "overdue" });
        }

        // Verificar notificações
        if (notificationsEnabled && reminder.notificationEnabled) {
          NOTIFICATION_INTERVALS.forEach((interval) => {
            const notificationKey = `${reminder.id}-${interval}`;
            
            // Enviar notificação se estiver no intervalo correto (com tolerância de 1 minuto)
            if (
              diffMinutes <= interval &&
              diffMinutes > interval - 1 &&
              !notifiedReminders.current.has(notificationKey)
            ) {
              notifiedReminders.current.add(notificationKey);
              
              const timeText = interval === 1 ? "1 minuto" : `${interval} minutos`;
              sendNotification(
                `⏰ ${reminder.title}`,
                `Faltam ${timeText} para: ${getReminderTypeLabel(reminder.reminderType).replace(/[^\w\s]/g, '')}`,
                notificationKey
              );

              // Mostrar toast também
              toast({
                title: `⏰ Lembrete em ${timeText}`,
                description: reminder.title,
              });
            }
          });
        }
      });
    };

    // Verificar imediatamente e depois a cada 30 segundos
    checkReminders();
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [reminders, notificationsEnabled, updateStatusMutation, sendNotification, toast]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((r: Reminder) => {
      const matchType = filterType === "all" || r.reminderType === filterType;
      const matchPriority =
        filterPriority === "all" || r.priority === filterPriority;
      return matchType && matchPriority;
    });
  }, [reminders, filterType, filterPriority]);

  const sortedReminders = useMemo(() => {
    return [...filteredReminders].sort((a: Reminder, b: Reminder) => {
      const dateA = parseLocalDateTime(a.dueDate, a.dueTime);
      const dateB = parseLocalDateTime(b.dueDate, b.dueTime);
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredReminders]);

  const getRemindersGrouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];
    const overdue: Reminder[] = [];
    const completed: Reminder[] = [];

    sortedReminders.forEach((reminder: Reminder) => {
      // Lembretes concluídos vão para a seção de concluídos
      if (reminder.status === "completed") {
        completed.push(reminder);
        return;
      }

      const dueDateTime = parseLocalDateTime(reminder.dueDate, reminder.dueTime);

      // Verificar se está atrasado (passou do horário)
      if (dueDateTime.getTime() < now.getTime() || reminder.status === "overdue") {
        overdue.push(reminder);
      } else if (dueDateTime >= todayStart && dueDateTime < tomorrowStart) {
        today.push(reminder);
      } else {
        upcoming.push(reminder);
      }
    });

    return { today, upcoming, overdue, completed };
  }, [sortedReminders]);

  const getReminderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prova: "🎓 Prova",
      trabalho: "📄 Trabalho",
      apresentacao: "📊 Apresentação",
      prazo: "⏰ Prazo",
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600";
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string | null) => {
    const date = parseLocalDate(dateStr);
    const dateFormatted = date.toLocaleDateString("pt-BR");
    if (timeStr) {
      return `${dateFormatted} às ${timeStr}`;
    }
    return dateFormatted;
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setDialogOpen(true);
  };

  const handleNewReminder = () => {
    setSelectedReminder(undefined);
    setDialogOpen(true);
  };

  // Componente de card de lembrete reutilizável
  const ReminderCard = ({ reminder, borderColor }: { reminder: Reminder; borderColor: string }) => (
    <Card key={reminder.id} className={borderColor}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <button
                className="mt-1 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatusMutation.mutate(reminder);
                }}
              >
                {reminder.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className={`w-5 h-5 ${
                    reminder.status === "overdue" ? "text-red-400" : 
                    borderColor.includes("blue") ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                  }`} />
                )}
              </button>
              <div className="flex-1">
                <p className={`font-medium ${reminder.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {reminder.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getReminderTypeLabel(reminder.reminderType)} • {formatDateTime(reminder.dueDate, reminder.dueTime)}
                </p>
                {reminder.description && (
                  <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reminder.notificationEnabled && (
              <Bell className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={`text-xs font-semibold ${getPriorityColor(reminder.priority || "medium")}`}>
              {(reminder.priority || "medium").toUpperCase()}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditReminder(reminder)}
            >
              ✏️
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMutation.mutate(reminder.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie provas, trabalhos e prazos importantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              size="icon"
              onClick={requestNotificationPermission}
              title={notificationsEnabled ? "Notificações ativadas" : "Ativar notificações"}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={handleNewReminder}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lembrete
            </Button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="prova">Prova</SelectItem>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="apresentacao">Apresentação</SelectItem>
              <SelectItem value="prazo">Prazo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Atrasados */}
      {getRemindersGrouped.overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            ⚠️ Atrasados ({getRemindersGrouped.overdue.length})
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.overdue.map((reminder) => (
              <ReminderCard 
                key={reminder.id} 
                reminder={reminder} 
                borderColor="border-red-200 dark:border-red-900" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Hoje */}
      {getRemindersGrouped.today.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            📅 Hoje ({getRemindersGrouped.today.length})
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.today.map((reminder) => (
              <ReminderCard 
                key={reminder.id} 
                reminder={reminder} 
                borderColor="border-blue-200 dark:border-blue-900" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Próximos */}
      {getRemindersGrouped.upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
            📍 Próximos ({getRemindersGrouped.upcoming.length})
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.upcoming.map((reminder) => (
              <ReminderCard 
                key={reminder.id} 
                reminder={reminder} 
                borderColor="border-green-200 dark:border-green-900" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Concluídos - Seção colapsável */}
      {getRemindersGrouped.completed.length > 0 && (
        <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                ✅ Concluídos ({getRemindersGrouped.completed.length})
              </h2>
              {showCompleted ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="grid gap-3">
              {getRemindersGrouped.completed.map((reminder) => (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder} 
                  borderColor="border-gray-200 dark:border-gray-800" 
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Mensagem quando não há lembretes */}
      {sortedReminders.length === 0 && (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground">Nenhum lembrete encontrado</p>
            <Button onClick={handleNewReminder} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Lembrete
            </Button>
          </CardContent>
        </Card>
      )}

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={selectedReminder}
        disciplines={disciplines}
      />
    </div>
  );
}

export default RemindersPage;
