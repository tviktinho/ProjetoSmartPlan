import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
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
import type { Reminder } from "@shared/schema";
import { ReminderDialog } from "@/components/reminder-dialog";
import { useToast } from "@/hooks/use-toast";

function RemindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const response = await fetch("/api/reminders");
      if (!response.ok) throw new Error("Erro ao carregar lembretes");
      return response.json();
    },
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
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
      const newStatus = reminder.status === "pending" ? "completed" : "pending";
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reminder,
          status: newStatus,
          completedAt: newStatus === "completed" ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

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
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredReminders]);

  const getRemindersGrouped = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];
    const overdue: Reminder[] = [];

    sortedReminders.forEach((reminder: Reminder) => {
      const dueDate = new Date(reminder.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (reminder.status === "completed") return;

      if (dueDate.getTime() < now.getTime()) {
        overdue.push(reminder);
      } else if (dueDate.getTime() === now.getTime()) {
        today.push(reminder);
      } else {
        upcoming.push(reminder);
      }
    });

    return { today, upcoming, overdue };
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

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setDialogOpen(true);
  };

  const handleNewReminder = () => {
    setSelectedReminder(undefined);
    setDialogOpen(true);
  };

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
          <Button onClick={handleNewReminder}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lembrete
          </Button>
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

      {getRemindersGrouped.overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            ⚠️ Atrasados
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.overdue.map((reminder) => (
              <Card key={reminder.id} className="border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        toggleStatusMutation.mutate(reminder)
                      }
                    >
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
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium line-through opacity-60">
                            {reminder.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getReminderTypeLabel(reminder.reminderType)} •{" "}
                            {new Date(reminder.dueDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority.toUpperCase()}
                      </span>
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
            ))}
          </div>
        </div>
      )}

      {getRemindersGrouped.today.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            📅 Hoje
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.today.map((reminder) => (
              <Card key={reminder.id} className="border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        toggleStatusMutation.mutate(reminder)
                      }
                    >
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
                            <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getReminderTypeLabel(reminder.reminderType)}
                            {reminder.dueTime && ` • ${reminder.dueTime}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority.toUpperCase()}
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
            ))}
          </div>
        </div>
      )}

      {getRemindersGrouped.upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
            📍 Próximos
          </h2>
          <div className="grid gap-3">
            {getRemindersGrouped.upcoming.map((reminder) => (
              <Card key={reminder.id} className="border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        toggleStatusMutation.mutate(reminder)
                      }
                    >
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
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getReminderTypeLabel(reminder.reminderType)} •{" "}
                            {new Date(reminder.dueDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority.toUpperCase()}
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
            ))}
          </div>
        </div>
      )}

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
