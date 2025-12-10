import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, Discipline } from "@shared/schema";

const WEEKDAYS = [
  { id: "sunday", label: "Dom" },
  { id: "monday", label: "Seg" },
  { id: "tuesday", label: "Ter" },
  { id: "wednesday", label: "Qua" },
  { id: "thursday", label: "Qui" },
  { id: "friday", label: "Sex" },
  { id: "saturday", label: "Sáb" },
];

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  eventType: z.string().min(1, "Tipo é obrigatório"),
  disciplineId: z.string().optional(),
  startDate: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  recurrenceDays: z.array(z.string()).optional(),
  recurrenceEndDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  selectedDate: Date | null;
  disciplines: Discipline[];
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  selectedDate,
  disciplines,
}: EventDialogProps) {
  const { toast } = useToast();
  const isEditing = !!event;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "aula",
      disciplineId: "none",
      startDate: "",
      startTime: "",
      endTime: "",
      location: "",
      isRecurring: false,
      recurrencePattern: "weekly",
      recurrenceDays: [],
      recurrenceEndDate: "",
    },
  });

  const isRecurring = form.watch("isRecurring");

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        eventType: event.eventType,
        disciplineId: event.disciplineId?.toString() || "none",
        startDate: event.startDate,
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location || "",
        isRecurring: event.isRecurring || false,
        recurrencePattern: event.recurrencePattern || "weekly",
        recurrenceDays: event.recurrenceDays || [],
        recurrenceEndDate: event.recurrenceEndDate || "",
      });
    } else if (selectedDate) {
      form.reset({
        title: "",
        description: "",
        eventType: "aula",
        disciplineId: "none",
        startDate: format(selectedDate, "yyyy-MM-dd"),
        startTime: "",
        endTime: "",
        location: "",
        isRecurring: false,
        recurrencePattern: "weekly",
        recurrenceDays: [],
        recurrenceEndDate: "",
      });
    }
  }, [event, selectedDate, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        disciplineId: (data.disciplineId && data.disciplineId !== "none") ? parseInt(data.disciplineId) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        description: data.description || null,
        recurrencePattern: data.isRecurring ? data.recurrencePattern : null,
        recurrenceDays: data.isRecurring ? data.recurrenceDays : null,
        recurrenceEndDate: data.isRecurring ? data.recurrenceEndDate || null : null,
      };
      await apiRequest("POST", "/api/events", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Evento criado",
        description: "O evento foi adicionado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        disciplineId: (data.disciplineId && data.disciplineId !== "none") ? parseInt(data.disciplineId) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        description: data.description || null,
        recurrencePattern: data.isRecurring ? data.recurrencePattern : null,
        recurrenceDays: data.isRecurring ? data.recurrenceDays : null,
        recurrenceEndDate: data.isRecurring ? data.recurrenceEndDate || null : null,
      };
      await apiRequest("PATCH", `/api/events/${event!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${event!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Evento excluído",
        description: "O evento foi removido com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento.",
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

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do evento."
              : "Adicione um novo compromisso ao seu calendário."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Aula de Cálculo"
                      {...field}
                      data-testid="input-event-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aula">Aula</SelectItem>
                        <SelectItem value="prova">Prova</SelectItem>
                        <SelectItem value="apresentacao">Apresentação</SelectItem>
                        <SelectItem value="monitoria">Monitoria</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disciplineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event-discipline">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {disciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-event-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-event-start-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fim</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-event-end-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Sala 3B101"
                      {...field}
                      data-testid="input-event-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma descrição..."
                      className="resize-none"
                      {...field}
                      data-testid="input-event-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Evento Recorrente</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Ativar para aulas e monitorias que se repetem
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-recurring"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <div className="space-y-4 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="recurrencePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurrence-pattern">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("recurrencePattern") === "weekly" && (
                  <FormField
                    control={form.control}
                    name="recurrenceDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dias da semana</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => (
                            <label
                              key={day.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={field.value?.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.id]);
                                  } else {
                                    field.onChange(
                                      current.filter((d) => d !== day.id)
                                    );
                                  }
                                }}
                                data-testid={`checkbox-day-${day.id}`}
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repetir até</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-recurrence-end" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={isPending}
                  data-testid="button-delete-event"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-event"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-save-event">
                  {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
