import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ExternalLink, Video, FileText } from "lucide-react";
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
import type { Meeting } from "@shared/schema";
import { MeetingDialog } from "@/components/meeting-dialog";
import { useToast } from "@/hooks/use-toast";

function MeetingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("scheduled");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await fetch("/api/meetings");
      if (!response.ok) throw new Error("Erro ao carregar reuniões");
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
      const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar reunião");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Sucesso", description: "Reunião deletada" });
    },
  });

  const filteredMeetings = meetings
    .filter((m: Meeting) => {
      const matchType = filterType === "all" || m.meetingType === filterType;
      const matchStatus = filterStatus === "all" || m.status === filterStatus;
      return matchType && matchStatus;
    })
    .sort((a: Meeting, b: Meeting) => {
      return (
        new Date(`${a.startDate}T${a.startTime}`).getTime() -
        new Date(`${b.startDate}T${b.startTime}`).getTime()
      );
    });

  const getMeetingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      trabalho: "💼 Trabalho",
      disciplina: "📚 Disciplina",
      estudo: "📖 Estudo",
      outro: "📌 Outro",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Agendada",
      ongoing: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDialogOpen(true);
  };

  const handleNewMeeting = () => {
    setSelectedMeeting(undefined);
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
            <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie reuniões de trabalho, disciplina e estudo
            </p>
          </div>
          <Button onClick={handleNewMeeting}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Reunião
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="disciplina">Disciplina</SelectItem>
              <SelectItem value="estudo">Estudo</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="ongoing">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredMeetings.length > 0 ? (
        <div className="grid gap-4">
          {filteredMeetings.map((meeting: Meeting) => (
            <Card key={meeting.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {meeting.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getMeetingTypeLabel(meeting.meetingType)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          meeting.status
                        )}`}
                      >
                        {getStatusLabel(meeting.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        📅{" "}
                        {new Date(meeting.startDate).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                      <span>
                        🕐 {meeting.startTime}
                        {meeting.endTime && ` - ${meeting.endTime}`}
                      </span>
                      {meeting.location && <span>📍 {meeting.location}</span>}
                    </div>

                    {meeting.description && (
                      <p className="text-sm mt-3 p-2 bg-muted rounded">
                        {meeting.description}
                      </p>
                    )}

                    {meeting.isCancelled && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-700">⚠️ Aula/Reunião Cancelada</p>
                        {meeting.cancellationReason && (
                          <p className="text-sm text-red-600 mt-1">{meeting.cancellationReason}</p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {meeting.videoCallUrl && (
                        <a
                          href={meeting.videoCallUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded hover:opacity-80"
                        >
                          <Video className="w-3 h-3" />
                          Videoconferência
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {meeting.notesUrl && (
                        <a
                          href={meeting.notesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded hover:opacity-80"
                        >
                          <FileText className="w-3 h-3" />
                          Anotações
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditMeeting(meeting)}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(meeting.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
            <Button onClick={handleNewMeeting} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Reunião
            </Button>
          </CardContent>
        </Card>
      )}

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        meeting={selectedMeeting}
        disciplines={disciplines}
      />
    </div>
  );
}

export default MeetingsPage;
