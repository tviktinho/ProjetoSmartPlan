import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    status: "present" as "present" | "absent" | "justified",
    justification: "",
  });

  // Fetch disciplines
  const { data: disciplines = [] } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
    queryFn: async () => {
      const res = await fetch("/api/disciplines");
      if (!res.ok) throw new Error("Erro ao carregar disciplinas");
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
      if (!res.ok) throw new Error("Erro ao carregar faltas");
      return res.json();
    },
    enabled: !!selectedDiscipline,
  });

  // Fetch stats
  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ["attendance-stats", selectedDiscipline],
    queryFn: async () => {
      const res = await fetch(`/api/attendances/stats/${selectedDiscipline}`);
      if (!res.ok) throw new Error("Erro ao carregar estatísticas");
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
      if (!res.ok) throw new Error("Erro ao registrar falta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances", selectedDiscipline] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats", selectedDiscipline] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "✓ Falta registrada com sucesso!" });
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "✗ Erro ao registrar", description: err.message, variant: "destructive" });
    },
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
      if (!res.ok) throw new Error("Erro ao atualizar falta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances", selectedDiscipline] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats", selectedDiscipline] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "✓ Falta atualizada com sucesso!" });
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "✗ Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const deleteAttendance = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/attendances/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover falta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances", selectedDiscipline] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats", selectedDiscipline] });
      toast({ title: "✓ Falta removida com sucesso!" });
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "✗ Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      attendance_date: new Date().toISOString().split("T")[0],
      status: "present",
      justification: "",
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!selectedDiscipline) {
      toast({ title: "⚠️ Selecione uma disciplina primeiro" });
      return;
    }

    if (!formData.attendance_date) {
      toast({ title: "⚠️ Data é obrigatória" });
      return;
    }

    if ((formData.status === "absent" || formData.status === "justified") && !formData.justification.trim()) {
      toast({ title: "⚠️ Motivo/Justificativa é obrigatória" });
      return;
    }

    if (editingId) {
      updateAttendance.mutate(editingId);
    } else {
      createAttendance.mutate(formData);
    }
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

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const disciplineMap = useMemo(() => {
    return new Map(disciplines.map((d) => [d.id.toString(), d]));
  }, [disciplines]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "justified":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "✅ Presente";
      case "absent":
        return "❌ Ausente";
      case "justified":
        return "⚠️ Justificada";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <Check className="w-4 h-4" />;
      case "absent":
        return <X className="w-4 h-4" />;
      case "justified":
        return <Check className="w-4 h-4" />;
      default:
        return null;
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
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">📋 Controle de Faltas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas presenças e faltas nas disciplinas
        </p>
      </div>

      {/* Discipline Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha uma disciplina..." />
            </SelectTrigger>
            <SelectContent>
              {disciplines.length > 0 ? (
                disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">Nenhuma disciplina encontrada</div>
              )}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">Presente</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.present}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">Ausente</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.absent}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Justificada</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.justified}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Taxa</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.attendance_rate}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Nova Falta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingId ? "✏️ Editar Falta" : "➕ Registrar Falta"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Atualize os dados da falta"
                    : "Registre uma nova falta ou presença"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-semibold">
                    Data da Aula
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.attendance_date}
                    onChange={(e) =>
                      setFormData({ ...formData, attendance_date: e.target.value })
                    }
                    className="w-full"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-semibold">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value, justification: "" })
                    }
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">✅ Presente</SelectItem>
                      <SelectItem value="absent">❌ Ausente</SelectItem>
                      <SelectItem value="justified">⚠️ Justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Motivo/Justificativa - Mostrado quando não é presente */}
                {formData.status !== "present" && (
                  <div className="space-y-2 border-l-4 border-orange-400 pl-4">
                    <Label htmlFor="justification" className="font-semibold text-orange-700 dark:text-orange-300">
                      {formData.status === "absent" ? "Motivo da Ausência" : "Justificativa"}
                    </Label>
                    <Textarea
                      id="justification"
                      placeholder={
                        formData.status === "absent"
                          ? "Ex: Doença, Problema de transporte, Compromisso importante..."
                          : "Ex: Aula de reposição, Consulta médica marcada..."
                      }
                      value={formData.justification}
                      onChange={(e) =>
                        setFormData({ ...formData, justification: e.target.value })
                      }
                      className="w-full min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.justification.length}/200 caracteres
                    </p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1" size="lg">
                    {createAttendance.isPending || updateAttendance.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Salvando...
                      </>
                    ) : editingId ? (
                      "Atualizar Falta"
                    ) : (
                      "Registrar Falta"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Attendances List */}
          {Object.keys(groupedAttendances).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedAttendances).map(([month, items]) => (
                <Card key={month}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize">{month}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items
                        .sort(
                          (a, b) =>
                            new Date(b.attendance_date).getTime() -
                            new Date(a.attendance_date).getTime()
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                              a.status === "present"
                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                                : a.status === "absent"
                                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                                  : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`rounded-full p-2 ${getStatusColor(a.status)}`}>
                                  {getStatusIcon(a.status)}
                                </div>
                                <div>
                                  <p className="font-bold">
                                    {new Date(a.attendance_date).toLocaleDateString(
                                      "pt-BR",
                                      {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      }
                                    )}
                                  </p>
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                                      a.status
                                    )}`}
                                  >
                                    {getStatusLabel(a.status)}
                                  </span>
                                </div>
                              </div>
                              {a.justification && (
                                <p className="text-sm mt-2 ml-11 text-gray-700 dark:text-gray-300 italic">
                                  💬 {a.justification}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(a)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAttendance.mutate(a.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                title="Deletar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                  📭 Nenhuma falta registrada ainda
                </p>
                <Button onClick={handleOpenDialog} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primeira Falta
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedDiscipline && (
        <Card>
          <CardContent className="pt-12 text-center pb-12">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              👆 Selecione uma disciplina para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
