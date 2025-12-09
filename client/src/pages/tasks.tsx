import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  CheckSquare,
  Filter,
  Pencil,
  Trash2,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TaskDialog } from "@/components/task-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Discipline } from "@shared/schema";

type FilterStatus = "all" | "todo" | "in_progress" | "completed";
type FilterPriority = "all" | "high" | "medium" | "low";

const priorityConfig = {
  high: {
    label: "Alta",
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-500",
  },
  medium: {
    label: "Média",
    variant: "default" as const,
    icon: Flag,
    color: "text-yellow-500",
  },
  low: {
    label: "Baixa",
    variant: "secondary" as const,
    icon: Circle,
    color: "text-gray-500",
  },
};

const statusConfig = {
  todo: { label: "A fazer", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "Em progresso", icon: Clock, color: "text-blue-500" },
  completed: { label: "Concluída", icon: CheckCircle2, color: "text-green-500" },
};

export default function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: disciplines = [] } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, {
        status: completed ? "completed" : "todo",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus !== "all" && task.status !== filterStatus) return false;
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      if (filterDiscipline !== "all" && task.disciplineId?.toString() !== filterDiscipline)
        return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterDiscipline]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      no_date: [],
      completed: [],
    };

    filteredTasks.forEach((task) => {
      if (task.status === "completed") {
        groups.completed.push(task);
      } else if (!task.dueDate) {
        groups.no_date.push(task);
      } else {
        const dueDate = parseISO(task.dueDate);
        if (isToday(dueDate)) {
          groups.today.push(task);
        } else if (isPast(dueDate)) {
          groups.overdue.push(task);
        } else {
          groups.upcoming.push(task);
        }
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      });
    });

    return groups;
  }, [filteredTasks]);

  const handleAddTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  const handleToggleComplete = (task: Task) => {
    toggleStatusMutation.mutate({
      id: task.id,
      completed: task.status !== "completed",
    });
  };

  const getDiscipline = (disciplineId: number | null) => {
    if (!disciplineId) return null;
    return disciplines.find((d) => d.id === disciplineId);
  };

  const renderTaskGroup = (title: string, tasks: Task[], icon: React.ElementType) => {
    if (tasks.length === 0) return null;
    const Icon = icon;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => {
            const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
            const discipline = getDiscipline(task.disciplineId);
            const PriorityIcon = priority.icon;

            return (
              <Card
                key={task.id}
                className={`hover-elevate transition-all ${
                  task.status === "completed" ? "opacity-60" : ""
                }`}
                data-testid={`task-card-${task.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleToggleComplete(task)}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              task.status === "completed"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {discipline && (
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: `${discipline.color}20`,
                                  color: discipline.color,
                                }}
                              >
                                {discipline.name}
                              </Badge>
                            )}
                            <Badge variant={priority.variant}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {priority.label}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(task.dueDate), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTask(task)}
                            data-testid={`button-edit-task-${task.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(task)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-tasks-title">
            Tarefas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas atividades e prazos.
          </p>
        </div>
        <Button onClick={handleAddTask} data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterPriority}
                onValueChange={(v) => setFilterPriority(v as FilterPriority)}
              >
                <SelectTrigger className="w-[140px]" data-testid="select-filter-priority">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterDiscipline}
                onValueChange={setFilterDiscipline}
              >
                <SelectTrigger className="w-[160px]" data-testid="select-filter-discipline">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium mb-1">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {tasks.length === 0
                  ? "Comece adicionando suas primeiras tarefas."
                  : "Tente ajustar os filtros para ver mais tarefas."}
              </p>
              {tasks.length === 0 && (
                <Button onClick={handleAddTask} data-testid="button-add-first-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tarefa
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {renderTaskGroup("Atrasadas", groupedTasks.overdue, AlertTriangle)}
              {renderTaskGroup("Hoje", groupedTasks.today, Clock)}
              {renderTaskGroup("Próximas", groupedTasks.upcoming, Calendar)}
              {renderTaskGroup("Sem data", groupedTasks.no_date, Circle)}
              {renderTaskGroup("Concluídas", groupedTasks.completed, CheckCircle2)}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        disciplines={disciplines}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{taskToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-task">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-task"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Calendar(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
