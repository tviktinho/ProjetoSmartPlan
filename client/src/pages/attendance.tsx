import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Attendance {
  id: number;
  discipline_id: number;
  meeting_id?: number;
  attendance_date: string;
  status: "present" | "absent" | "justified";
  justification?: string;
  created_at: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  justified: number;
  attendance_rate: number;
}

interface Discipline {
  id: number;
  name: string;
  code?: string;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    attendance_date: new Date().toISOString().split("T")[0],
    status: "present" as const,
    justification: "",
  });

  // Fetch disciplines
  const { data: disciplines = [] } = useQuery<Discipline[]>({
    queryKey: ["disciplines"],
    queryFn: async () => {
      const res = await fetch("/api/disciplines");
      return res.json();
    },
  });

  // Fetch attendances
  const { data: attendances = [] } = useQuery<Attendance[]>({
    queryKey: ["attendances", selectedDiscipline],
    queryFn: async () => {
      const url = new URL("/api/attendances", window.location.origin);
      if (selectedDiscipline) {
        url.searchParams.append("discipline_id", selectedDiscipline);
      }
      const res = await fetch(url);
      return res.json();
    },
    enabled: !!selectedDiscipline,
  });

  // Fetch stats
  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ["attendance-stats", selectedDiscipline],
    queryFn: async () => {
      const res = await fetch(`/api/attendances/stats/${selectedDiscipline}`);
      return res.json();
    },
    enabled: !!selectedDiscipline,
  });

  // Mutations
  const createAttendance = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          discipline_id: parseInt(selectedDiscipline),
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
      setIsDialogOpen(false);
      toast({ title: "✓ Falta registrada" });
    },
    onError: (err: any) => toast({ title: "✗ Erro ao registrar", variant: "destructive" }),
  });

  const updateAttendance = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/attendances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          justification: formData.justification,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
      setIsDialogOpen(false);
      toast({ title: "✓ Falta atualizada" });
    },
  });

  const deleteAttendance = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/attendances/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
      toast({ title: "✓ Falta removida" });
    },
  });

  const handleSubmit = () => {
    if (editingId) {
      updateAttendance.mutate(editingId);
    } else {
      createAttendance.mutate(formData);
    }
    setFormData({
      attendance_date: new Date().toISOString().split("T")[0],
      status: "present",
      justification: "",
    });
    setEditingId(null);
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingId(attendance.id);
    setFormData({
      attendance_date: attendance.attendance_date,
      status: attendance.status,
      justification: attendance.justification || "",
    });
    setIsDialogOpen(true);
  };

  const disciplineMap = useMemo(() => {
    return new Map(disciplines.map((d) => [d.id.toString(), d]));
  }, [disciplines]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "justified":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Presente";
      case "absent":
        return "Ausente";
      case "justified":
        return "Justificada";
      default:
        return status;
    }
  };

  const groupedAttendances = useMemo(() => {
    const grouped: Record<string, Attendance[]> = {};
    attendances.forEach((a) => {
      const month = new Date(a.attendance_date).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(a);
    });
    return grouped;
  }, [attendances]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Faltas</h1>
        <p className="text-gray-600">Gerencie suas presenças e faltas nas disciplinas</p>
      </div>

      {/* Discipline Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma disciplina" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDiscipline && stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600">Presente</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-600">Ausente</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-yellow-600">Justificada</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.justified}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600">Taxa</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.attendance_rate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Falta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Falta" : "Registrar Falta"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.attendance_date}
                    onChange={(e) =>
                      setFormData({ ...formData, attendance_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Presente</SelectItem>
                      <SelectItem value="absent">Ausente</SelectItem>
                      <SelectItem value="justified">Justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.status === "absent" || formData.status === "justified") && (
                  <div>
                    <Label>Motivo/Justificativa</Label>
                    <Textarea
                      value={formData.justification}
                      onChange={(e) =>
                        setFormData({ ...formData, justification: e.target.value })
                      }
                      placeholder="Ex: Consulta médica, doença..."
                    />
                  </div>
                )}
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Atualizar" : "Registrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Attendances List */}
          <div className="space-y-4">
            {Object.entries(groupedAttendances).map(([month, items]) => (
              <Card key={month}>
                <CardHeader>
                  <CardTitle className="text-lg">{month}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items
                      .sort(
                        (a, b) =>
                          new Date(b.attendance_date).getTime() -
                          new Date(a.attendance_date).getTime()
                      )
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {new Date(a.attendance_date).toLocaleDateString("pt-BR")}
                            </p>
                            {a.justification && (
                              <p className="text-sm text-gray-600">{a.justification}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(a.status)}`}>
                              {getStatusLabel(a.status)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(a)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAttendance.mutate(a.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
