import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, BookOpen, Pencil, Trash2, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { DisciplineDialog } from "@/components/discipline-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Discipline } from "@shared/schema";

export default function DisciplinesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<Discipline | null>(
    null
  );
  const { toast } = useToast();

  const { data: disciplines = [], isLoading } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/disciplines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDisciplineToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a disciplina.",
        variant: "destructive",
      });
    },
  });

  const handleAddDiscipline = () => {
    setEditingDiscipline(null);
    setDialogOpen(true);
  };

  const handleEditDiscipline = (discipline: Discipline) => {
    setEditingDiscipline(discipline);
    setDialogOpen(true);
  };

  const handleDeleteClick = (discipline: Discipline) => {
    setDisciplineToDelete(discipline);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (disciplineToDelete) {
      deleteMutation.mutate(disciplineToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-disciplines-title">
            Disciplinas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as disciplinas do seu semestre.
          </p>
        </div>
        <Button onClick={handleAddDiscipline} data-testid="button-add-discipline">
          <Plus className="h-4 w-4 mr-2" />
          Nova Disciplina
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : disciplines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium mb-1">Nenhuma disciplina cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando as disciplinas do seu semestre.
            </p>
            <Button onClick={handleAddDiscipline} data-testid="button-add-first-discipline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Disciplina
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((discipline) => (
            <Card
              key={discipline.id}
              className="overflow-hidden hover-elevate transition-all"
              data-testid={`discipline-card-${discipline.id}`}
            >
              <div
                className="h-2"
                style={{ backgroundColor: discipline.color || "#3B82F6" }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{discipline.name}</CardTitle>
                    {discipline.code && (
                      <Badge variant="outline" className="mt-1">
                        {discipline.code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditDiscipline(discipline)}
                      data-testid={`button-edit-discipline-${discipline.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(discipline)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-discipline-${discipline.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {discipline.professor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="truncate">{discipline.professor}</span>
                  </div>
                )}
                {discipline.semester && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{discipline.semester}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DisciplineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discipline={editingDiscipline}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir disciplina?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a disciplina "{disciplineToDelete?.name}"?
              Os eventos e tarefas associados perderão a referência a esta disciplina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
