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
import type { Reminder } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: Reminder;
  disciplines: Array<{ id: number; name: string }>;
}

export function ReminderDialog({
  open,
  onOpenChange,
  reminder,
  disciplines,
}: ReminderDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: "",
    reminderType: "trabalho",
    dueDate: "",
    priority: "medium",
    notificationEnabled: true,
    status: "pending",
  });

  useEffect(() => {
    if (reminder) {
      setFormData(reminder);
    } else {
      setFormData({
        title: "",
        reminderType: "trabalho",
        dueDate: "",
        priority: "medium",
        notificationEnabled: true,
        status: "pending",
      });
    }
  }, [reminder, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = reminder
        ? `/api/reminders/${reminder.id}`
        : "/api/reminders";
      const method = reminder ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao salvar lembrete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      onOpenChange(false);
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
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="reminderType">Tipo de Lembrete</Label>
            <Select
              value={formData.reminderType || "trabalho"}
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

          <div>
            <Label htmlFor="dueDate">Data do Lembrete</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="dueTime">Hora (opcional)</Label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueTime: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="discipline">Disciplina (opcional)</Label>
            <Select
              value={(formData.disciplineId || "").toString()}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  disciplineId: value ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar disciplina" />
              </SelectTrigger>
              <SelectContent>
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
              value={formData.priority || "medium"}
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
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Adicione mais detalhes..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notification"
              checked={formData.notificationEnabled || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificationEnabled: checked })
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
