import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Target, Pencil, Trash2, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { GoalDialog } from "@/components/goal-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StudyGoal } from "@shared/schema";

export default function GoalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<StudyGoal | null>(null);
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery<StudyGoal[]>({
    queryKey: ["/api/goals"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Meta excluída",
        description: "A meta foi removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta.",
        variant: "destructive",
      });
    },
  });

  const updateHoursMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: number; hours: number }) => {
      await apiRequest("PATCH", `/api/goals/${id}`, { currentHours: hours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as horas.",
        variant: "destructive",
      });
    },
  });

  const handleAddGoal = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handleEditGoal = (goal: StudyGoal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleDeleteClick = (goal: StudyGoal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (goalToDelete) {
      deleteMutation.mutate(goalToDelete.id);
    }
  };

  const handleHoursChange = (goal: StudyGoal, value: string) => {
    const hours = parseInt(value) || 0;
    if (hours >= 0 && hours <= goal.targetHours * 2) {
      updateHoursMutation.mutate({ id: goal.id, hours });
    }
  };

  const totalTargetHours = goals.reduce((sum, g) => sum + g.targetHours, 0);
  const totalCurrentHours = goals.reduce((sum, g) => sum + (g.currentHours || 0), 0);
  const overallProgress = totalTargetHours > 0 ? Math.round((totalCurrentHours / totalTargetHours) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-goals-title">
            Metas de Estudo
          </h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas de estudo.
          </p>
        </div>
        <Button onClick={handleAddGoal} data-testid="button-add-goal">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Metas Ativas</p>
                  <p className="text-2xl font-bold">{goals.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Horas Estudadas</p>
                  <p className="text-2xl font-bold">{totalCurrentHours}h</p>
                  <p className="text-xs text-muted-foreground">de {totalTargetHours}h</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progresso Geral</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium mb-1">Nenhuma meta definida</h3>
            <p className="text-muted-foreground text-center mb-4">
              Defina metas de estudo para acompanhar seu progresso acadêmico.
            </p>
            <Button onClick={handleAddGoal} data-testid="button-add-first-goal">
              <Plus className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = Math.min(
              Math.round(((goal.currentHours || 0) / goal.targetHours) * 100),
              100
            );
            const isCompleted = progress >= 100;

            return (
              <Card
                key={goal.id}
                className={`hover-elevate transition-all ${
                  isCompleted ? "border-green-500/50" : ""
                }`}
                data-testid={`goal-card-${goal.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {goal.periodType === "weekly" ? "Semanal" : "Mensal"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditGoal(goal)}
                        data-testid={`button-edit-goal-${goal.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(goal)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-goal-${goal.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Progresso
                        </span>
                        <span className="text-sm font-medium">
                          {goal.currentHours || 0}h / {goal.targetHours}h
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-3 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
                      />
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isCompleted ? "text-green-500" : ""
                      }`}
                    >
                      {progress}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Registrar horas:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max={goal.targetHours * 2}
                      value={goal.currentHours || 0}
                      onChange={(e) => handleHoursChange(goal, e.target.value)}
                      className="w-20"
                      data-testid={`input-hours-${goal.id}`}
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                  </div>

                  {isCompleted && (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      Meta alcançada! Parabéns!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goalToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-goal">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-goal"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
