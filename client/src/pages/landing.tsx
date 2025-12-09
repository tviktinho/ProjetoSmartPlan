import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Calendar,
  CheckSquare,
  BookOpen,
  Target,
  Clock,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Organize Disciplinas",
    description:
      "Cadastre todas as disciplinas do seu semestre com código, professor e horários.",
  },
  {
    icon: Calendar,
    title: "Calendário Completo",
    description:
      "Visualize aulas, provas e apresentações em um calendário intuitivo mensal ou semanal.",
  },
  {
    icon: CheckSquare,
    title: "Gerencie Tarefas",
    description:
      "Crie tarefas com prioridades e acompanhe o progresso de cada atividade.",
  },
  {
    icon: Target,
    title: "Defina Metas",
    description:
      "Estabeleça metas de estudo semanais e monitore seu desempenho acadêmico.",
  },
  {
    icon: Clock,
    title: "Eventos Recorrentes",
    description:
      "Configure aulas e monitorias recorrentes para não perder nenhum compromisso.",
  },
  {
    icon: Bell,
    title: "Lembretes",
    description:
      "Receba notificações sobre provas e prazos de entrega importantes.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              UFU
            </div>
            <span className="font-semibold text-lg">SmartPlan</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container px-4 mx-auto text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Organize sua vida acadêmica na{" "}
                <span className="text-primary">UFU</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Uma agenda escolar completa para estudantes e professores da
                Universidade Federal de Uberlândia. Gerencie disciplinas,
                tarefas e compromissos em um só lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <Link href="/signup">Começar Agora</Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">Saiba Mais</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tudo que você precisa para estudar melhor
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Funcionalidades pensadas para otimizar sua rotina de estudos e
                aumentar sua produtividade acadêmica.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="hover-elevate transition-all duration-200"
                  data-testid={`feature-card-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto text-center">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para começar?
              </h2>
              <p className="text-muted-foreground text-lg">
                Acesse com seu e-mail institucional @ufu.br e comece a
                organizar sua vida acadêmica hoje mesmo.
              </p>
              <Button size="lg" asChild data-testid="button-cta-login">
                <Link href="/login">Acessar com E-mail UFU</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container px-4 mx-auto text-center text-sm text-muted-foreground">
          <p>Agenda Escolar UFU - Organize seus estudos com eficiência</p>
        </div>
      </footer>
    </div>
  );
}
