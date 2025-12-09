import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Discipline } from "@shared/schema";

const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().optional(),
  professor: z.string().optional(),
  semester: z.string().optional(),
  color: z.string().default("#3B82F6"),
});

type FormData = z.infer<typeof formSchema>;

interface DisciplineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discipline: Discipline | null;
}

export function DisciplineDialog({
  open,
  onOpenChange,
  discipline,
}: DisciplineDialogProps) {
  const { toast } = useToast();
  const isEditing = !!discipline;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      professor: "",
      semester: "",
      color: "#3B82F6",
    },
  });

  useEffect(() => {
    if (discipline) {
      form.reset({
        name: discipline.name,
        code: discipline.code || "",
        professor: discipline.professor || "",
        semester: discipline.semester || "",
        color: discipline.color || "#3B82F6",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        professor: "",
        semester: "",
        color: "#3B82F6",
      });
    }
  }, [discipline, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/disciplines", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      toast({
        title: "Disciplina criada",
        description: "A disciplina foi adicionada com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a disciplina.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("PATCH", `/api/disciplines/${discipline!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      toast({
        title: "Disciplina atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a disciplina.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Disciplina" : "Nova Disciplina"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da disciplina."
              : "Adicione uma nova disciplina ao seu semestre."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Sistemas Distribuídos"
                      {...field}
                      data-testid="input-discipline-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código UFU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: GCC123"
                      {...field}
                      data-testid="input-discipline-code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Dr. João Silva"
                      {...field}
                      data-testid="input-discipline-professor"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semestre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 2024/2"
                      {...field}
                      data-testid="input-discipline-semester"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            field.value === color
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          data-testid={`color-${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-discipline"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-discipline">
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
