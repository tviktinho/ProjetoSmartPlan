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
import type { Meeting } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting;
  disciplines: Array<{ id: number; name: string }>;
}

export function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  disciplines,
}: MeetingDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Meeting>>({
    title: "",
    meetingType: "trabalho",
    startDate: "",
    startTime: "",
    status: "scheduled",
  });

  useEffect(() => {
    if (meeting) {
      setFormData(meeting);
    } else {
      setFormData({
        title: "",
        meetingType: "trabalho",
        startDate: "",
        startTime: "",
        status: "scheduled",
      });
    }
  }, [meeting, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = meeting ? `/api/meetings/${meeting.id}` : "/api/meetings";
      const method = meeting ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao salvar reunião");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Editar Reunião" : "Nova Reunião"}
          </DialogTitle>
          <DialogDescription>
            {meeting
              ? "Atualize os dados da reunião"
              : "Agende uma nova reunião de trabalho ou disciplina"}
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
            <Label htmlFor="meetingType">Tipo de Reunião</Label>
            <Select
              value={formData.meetingType || "trabalho"}
              onValueChange={(value) =>
                setFormData({ ...formData, meetingType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="disciplina">Disciplina</SelectItem>
                <SelectItem value="estudo">Estudo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Hora Início</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime || ""}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endTime">Hora Fim (opcional)</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime || ""}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
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
            <Label htmlFor="location">Local/Sala (opcional)</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ex: Sala 101, Aula Virtual"
            />
          </div>

          <div>
            <Label htmlFor="videoCallUrl">Link da Videoconferência (opcional)</Label>
            <Input
              id="videoCallUrl"
              type="url"
              value={formData.videoCallUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, videoCallUrl: e.target.value })
              }
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <Label htmlFor="notesUrl">Link das Anotações (opcional)</Label>
            <Input
              id="notesUrl"
              type="url"
              value={formData.notesUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, notesUrl: e.target.value })
              }
              placeholder="https://docs.google.com/..."
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição/Agenda (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tópicos a discutir, objetivos da reunião..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.isRecurring || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecurring: checked })
              }
            />
            <Label htmlFor="recurring">Reunião Recorrente</Label>
          </div>

          {formData.isRecurring && (
            <>
              <div>
                <Label htmlFor="recurrencePattern">Padrão de Recorrência</Label>
                <Select
                  value={formData.recurrencePattern || "weekly"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurrencePattern: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
