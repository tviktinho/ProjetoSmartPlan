import React, { useState } from 'react';

export function ExtratorPlanoEnsino() {
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);

  const extrairEventos = async () => {
    if (!texto) return;
    setCarregando(true);
    
    try {
      // Aqui a mágica acontece: o React envia o texto para o seu Python
      const response = await fetch('http://localhost:8000/extrair-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });

      const data = await response.json();
      setEventos(data.eventos);
    } catch (error) {
      console.error("Erro na API:", error);
      alert("Erro ao conectar com a IA. O servidor Python está rodando?");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm mt-6">
      <h2 className="text-xl font-bold mb-2">Analisar Plano de Ensino com IA</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Cole o texto do plano de ensino abaixo para o modelo extrair automaticamente as atividades.
      </p>
      
      <textarea 
        className="w-full h-40 p-3 border rounded-md mb-4 bg-background"
        placeholder="Cole o texto aqui..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      
      <button 
        onClick={extrairEventos} 
        disabled={carregando}
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50 font-semibold"
      >
        {carregando ? 'A processar com Inteligência Artificial...' : 'Extrair Datas e Notas'}
      </button>

      {/* Exibição dos resultados */}
      {eventos.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Eventos Identificados:</h3>
          <ul className="space-y-3">
            {eventos.map((evt, index) => (
              <li key={index} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                <div>
                  <strong className="block text-sm">{evt.titulo}</strong>
                  <span className="text-xs text-muted-foreground">Nota/Peso: {evt.nota}</span>
                </div>
                <div className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded">
                  {evt.data}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}