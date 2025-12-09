import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckSquare,
  Calendar,
  BookOpen,
  Target,
  Clock,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, Event, Discipline, StudyGoal } from "@shared/schema";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityBadge(priority: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    high: { variant: "destructive", label: "Alta" },
    medium: { variant: "default", label: "Média" },
    low: { variant: "secondary", label: "Baixa" },
  };
  return variants[priority] || variants.medium;
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
    todo: { variant: "outline", label: "A fazer" },
    in_progress: { variant: "default", label: "Em progresso" },
    completed: { variant: "secondary", label: "Concluída" },
  };
  return variants[status] || variants.todo;
}

function formatEventDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "dd/MM", { locale: ptBR });
}

export default function Dashboard() {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: disciplines = [], isLoading: disciplinesLoading } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<StudyGoal[]>({
    queryKey: ["/api/goals"],
  });

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = parseISO(e.startDate);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const urgentTasks = pendingTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const isLoading = tasksLoading || eventsLoading || disciplinesLoading || goalsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Veja o resumo dos seus estudos.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tarefas Pendentes"
          value={pendingTasks.length}
          icon={CheckSquare}
          description={`${completedTasks.length} concluídas`}
          loading={tasksLoading}
        />
        <StatCard
          title="Eventos Esta Semana"
          value={upcomingEvents.length}
          icon={Calendar}
          description="Próximos 7 dias"
          loading={eventsLoading}
        />
        <StatCard
          title="Disciplinas"
          value={disciplines.length}
          icon={BookOpen}
          description="Cadastradas"
          loading={disciplinesLoading}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${completionRate}%`}
          icon={TrendingUp}
          description="Das tarefas"
          loading={tasksLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximos Eventos
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendario" data-testid="link-view-calendar">
                Ver tudo <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum evento próximo</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/calendario" data-testid="link-add-event">
                    Adicionar evento
                  </Link>
                </Button>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  data-testid={`event-card-${event.id}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    {formatEventDate(event.startDate)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.startTime && format(parseISO(`2000-01-01T${event.startTime}`), "HH:mm")}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {event.eventType === "aula"
                      ? "Aula"
                      : event.eventType === "prova"
                      ? "Prova"
                      : event.eventType === "apresentacao"
                      ? "Apresentação"
                      : event.eventType === "monitoria"
                      ? "Monitoria"
                      : "Outro"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Tarefas Prioritárias
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tarefas" data-testid="link-view-tasks">
                Ver tudo <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : urgentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma tarefa pendente</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/tarefas" data-testid="link-add-task">
                    Adicionar tarefa
                  </Link>
                </Button>
              </div>
            ) : (
              urgentTasks.map((task) => {
                const priority = getPriorityBadge(task.priority);
                const status = getStatusBadge(task.status);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`task-card-${task.id}`}
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        task.status === "completed"
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {task.status === "completed" && (
                        <CheckSquare className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          task.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.dueDate && `Entrega: ${format(parseISO(task.dueDate), "dd/MM/yyyy", { locale: ptBR })}`}
                      </p>
                    </div>
                    <Badge variant={priority.variant} className="shrink-0">
                      {priority.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {goals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas de Estudo
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/metas" data-testid="link-view-goals">
                Ver tudo <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : (
              goals.slice(0, 3).map((goal) => {
                const progress = Math.min(
                  Math.round(((goal.currentHours || 0) / goal.targetHours) * 100),
                  100
                );
                return (
                  <div key={goal.id} className="space-y-2" data-testid={`goal-card-${goal.id}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{goal.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {goal.currentHours || 0}h / {goal.targetHours}h
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
