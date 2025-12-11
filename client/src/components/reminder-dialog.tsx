import { useState, useEffect, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Reminder } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: Reminder;
  disciplines: Array<{ id: number; name: string }>;
}

interface FormData {
  title: string;
  reminderType: string;
  dueDate: string;
  dueTime: string;
  priority: string;
  description: string;
  disciplineId: string;
  notificationEnabled: boolean;
}

export function ReminderDialog({
  open,
  onOpenChange,
  reminder,
  disciplines,
}: ReminderDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    reminderType: "trabalho",
    dueDate: "",
    dueTime: "",
    priority: "medium",
    description: "",
    disciplineId: "none",
    notificationEnabled: true,
  });

  useEffect(() => {
    if (open) {
      if (reminder) {
        setFormData({
          title: reminder.title || "",
          reminderType: reminder.reminderType || "trabalho",
          dueDate: reminder.dueDate || "",
          dueTime: reminder.dueTime || "",
          priority: reminder.priority || "medium",
          description: reminder.description || "",
          disciplineId: reminder.disciplineId?.toString() || "none",
          notificationEnabled: reminder.notificationEnabled ?? true,
        });
      } else {
        setFormData({
          title: "",
          reminderType: "trabalho",
          dueDate: "",
          dueTime: "",
          priority: "medium",
          description: "",
          disciplineId: "none",
          notificationEnabled: true,
        });
      }
    }
  }, [reminder, open]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = reminder
        ? `/api/reminders/${reminder.id}`
        : "/api/reminders";
      const method = reminder ? "PATCH" : "POST";
      
      // Preparar payload apenas com campos necessários
      const payload = {
        title: data.title,
        reminderType: data.reminderType,
        dueDate: data.dueDate,
        dueTime: data.dueTime || null,
        priority: data.priority,
        description: data.description || null,
        disciplineId: data.disciplineId && data.disciplineId !== "none" ? parseInt(data.disciplineId) : null,
        notificationEnabled: data.notificationEnabled,
        // Manter status como pending ao editar (não resetar para overdue)
        status: reminder?.status === "completed" ? "completed" : "pending",
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
        throw new Error(error.detail || "Erro ao salvar lembrete");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: reminder ? "Lembrete atualizado" : "Lembrete criado",
        description: reminder 
          ? "As alterações foram salvas com sucesso."
          : "O lembrete foi criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reminder ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
          <DialogDescription>
            {reminder
              ? "Atualize os dados do lembrete"
              : "Crie um novo lembrete para provas, trabalhos ou prazos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="reminderType">Tipo de Lembrete</Label>
            <Select
              value={formData.reminderType}
              onValueChange={(value) =>
                setFormData({ ...formData, reminderType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prova">Prova</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="apresentacao">Apresentação</SelectItem>
                <SelectItem value="prazo">Prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Data *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="dueTime">Hora</Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) =>
                  setFormData({ ...formData, dueTime: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="discipline">Disciplina</Label>
            <Select
              value={formData.disciplineId}
              onValueChange={(value) =>
                setFormData({ ...formData, disciplineId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Adicione mais detalhes..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notification"
              checked={formData.notificationEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificationEnabled: !!checked })
              }
            />
            <Label htmlFor="notification">Ativar notificações</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
