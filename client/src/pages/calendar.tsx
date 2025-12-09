import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDialog } from "@/components/event-dialog";
import type { Event, Discipline } from "@shared/schema";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getEventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    aula: "Aula",
    prova: "Prova",
    apresentacao: "Apresentação",
    monitoria: "Monitoria",
    outro: "Outro",
  };
  return labels[type] || type;
}

function getEventTypeColor(type: string) {
  const colors: Record<string, string> = {
    aula: "bg-blue-500",
    prova: "bg-red-500",
    apresentacao: "bg-purple-500",
    monitoria: "bg-green-500",
    outro: "bg-gray-500",
  };
  return colors[type] || colors.outro;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: disciplines = [] } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const getDisciplineColor = (disciplineId: number | null) => {
    if (!disciplineId) return "#6B7280";
    const discipline = disciplines.find((d) => d.id === disciplineId);
    return discipline?.color || "#6B7280";
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(eventDate, date);
    });
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [events]);

  const handlePrev = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDate(parseISO(event.startDate));
    setDialogOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedDate(new Date());
    setEditingEvent(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-calendar-title">
            Calendário
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus compromissos acadêmicos.
          </p>
        </div>
        <Button onClick={handleAddEvent} data-testid="button-add-event">
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev} data-testid="button-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} data-testid="button-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} data-testid="button-today">
                Hoje
              </Button>
              <h2 className="text-lg font-semibold ml-2" data-testid="text-current-month">
                {format(currentDate, view === "week" ? "'Semana de' dd MMM yyyy" : "MMMM yyyy", {
                  locale: ptBR,
                })}
              </h2>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList>
                <TabsTrigger value="month" data-testid="tab-month">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Mês
                </TabsTrigger>
                <TabsTrigger value="week" data-testid="tab-week">
                  <Clock className="h-4 w-4 mr-2" />
                  Semana
                </TabsTrigger>
                <TabsTrigger value="list" data-testid="tab-list">
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 rounded-lg" />
                  ))}
                </div>
              ))}
            </div>
          ) : view === "month" ? (
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-24 p-2 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                        isCurrentMonth
                          ? "bg-background"
                          : "bg-muted/30 text-muted-foreground"
                      } ${isCurrentDay ? "ring-2 ring-primary" : ""}`}
                      data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isCurrentDay
                            ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${getEventTypeColor(
                              event.eventType
                            )}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : view === "week" ? (
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day, index) => (
                  <div key={day} className="text-center py-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                    <div
                      className={`text-lg font-semibold mt-1 ${
                        isToday(weekDays[index])
                          ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                          : ""
                      }`}
                    >
                      {format(weekDays[index], "d")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-48 p-2 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                        isCurrentDay ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid={`week-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs p-2 rounded text-white ${getEventTypeColor(
                              event.eventType
                            )}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.startTime && (
                              <div className="opacity-80">
                                {event.startTime.slice(0, 5)}
                                {event.endTime && ` - ${event.endTime.slice(0, 5)}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum evento cadastrado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleAddEvent}
                    data-testid="button-add-first-event"
                  >
                    Adicionar evento
                  </Button>
                </div>
              ) : (
                sortedEvents.map((event) => {
                  const discipline = disciplines.find(
                    (d) => d.id === event.disciplineId
                  );
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover-elevate"
                      data-testid={`list-event-${event.id}`}
                    >
                      <div
                        className={`w-1 h-full min-h-12 rounded-full ${getEventTypeColor(
                          event.eventType
                        )}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(event.startDate), "EEEE, dd 'de' MMMM", {
                                locale: ptBR,
                              })}
                              {event.startTime && ` às ${event.startTime.slice(0, 5)}`}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {getEventTypeLabel(event.eventType)}
                          </Badge>
                        </div>
                        {(discipline || event.location) && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            {discipline && (
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: `${discipline.color}20`,
                                  color: discipline.color,
                                }}
                              >
                                {discipline.name}
                              </Badge>
                            )}
                            {event.location && <span>{event.location}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        selectedDate={selectedDate}
        disciplines={disciplines}
      />
    </div>
  );
}
