// Todo texto e numero das paginas de APRESENTACAO mora aqui (nada espalhado em componente).
// Numeros vem de estatisticas.json, gerado por datascience/treinar_modelo.py a partir da base real.
import { BASE, milhar, pct } from '../dados/base'

export interface Ods {
  numero: number
  nome: string
  cor: string
  contribuicao: string
}

export interface Membro {
  nome: string
  rm: string
}

const fonteKaggle = `${milhar(BASE.consultas)} consultas reais do SUS, Vitória-ES, 2016 — base pública Medical Appointment No Shows (Kaggle)`

export const SITE = {
  marca: 'Zelo',
  conceito: 'Cuidado que chega antes.',

  hero: {
    selo: 'CitizenTech · Global Solution FIAP 2026',
    titulo: ['Toda consulta perdida', 'tem alguém', 'esperando por ela.'],
    enfase: 2, // indice da linha em italico/cor
    subtitulo:
      'O Zelo é um assistente por voz e texto que entrega a consulta desmarcada ao próximo da fila em minutos — e avisa quem mora em área de risco antes de a rua alagar.',
    ctaPrincipal: 'Ver a demonstração',
    ctaSecundario: 'Como funciona',
    cartoes: ['Vaga aberta: amanhã, 8h', 'Alerta de chuva forte'],
    // Conversa que o celular do hero "digita" sozinho: textos e valores reais da demo (vaga das 8h do seed;
    // 465 m = distancia calculada pelo backend da casa da Dona Cida ate o abrigo).
    chat: [
      { de: 'zelo', texto: 'Abriu uma vaga de Clínica Geral amanhã às 8h. Você quer? Tem 15 minutos para responder.' },
      { de: 'cida', texto: 'Quero a vaga!', audio: true },
      { de: 'zelo', texto: 'Pronto, Cida! Sua consulta está marcada. Pode ir tranquila.' },
      { de: 'zelo', texto: 'ATENÇÃO: vai chover forte perto de Casa. Abrigo mais perto: EMEF Exemplo Alto, a 465 m.' },
    ] as { de: 'zelo' | 'cida'; texto: string; audio?: boolean }[],
  },

  marquee: ['Saúde', 'Encaixe', 'Voz', 'UBS', 'Enchente', 'Defesa Civil', 'WhatsApp'],

  problema: {
    titulo: 'Uma em cada cinco cadeiras fica vazia.',
    texto: 'Enquanto a sala de espera esvazia por falta, a fila do lado de fora cresce — gente esperando meses pela mesma consulta.',
    numeros: [
      { valor: BASE.taxaFalta, rotulo: 'das consultas tiveram falta' },
      { valor: BASE.taxaFaltaComFaltaAnterior, rotulo: 'faltam de novo entre quem já faltou' },
      { valor: BASE.taxaFalta15DiasOuMais, rotulo: 'de falta quando marcada com 15+ dias' },
    ],
    fonte: fonteKaggle,
    cadeiras: 30,
  },

  solucao: {
    titulo: 'Como o Zelo devolve a vaga',
    passos: [
      { titulo: 'Lembrete na véspera, por áudio', texto: 'O Zelo pergunta: "Você vai amanhã?". Responde por voz ou toque.', tela: 'Lembrete: consulta amanhã às 8h. Você vai?' },
      { titulo: 'Alguém cancela', texto: 'Quem não pode ir avisa — ou não responde até 4 h antes. A vaga é liberada na hora.', tela: 'Tudo bem, cancelei. Outra pessoa vai aproveitar a vaga.' },
      { titulo: 'A vaga viaja para o próximo da fila', texto: 'Prioridade legal, gravidade, espera, distância e menor risco de faltar decidem quem recebe.', tela: 'Abriu uma vaga para você. Tem 15 minutos.' },
      { titulo: 'Dona Cida aceita por voz', texto: '"Quero a vaga." A consulta é marcada e o painel da UBS se atualiza sozinho.', tela: 'Pronto, Cida! Consulta marcada.' },
    ],
  },

  enchente: {
    titulo: 'E quando a chuva chega antes do aviso?',
    texto:
      'A cada 15 minutos o Zelo lê a previsão (Open-Meteo) de cada área perto de córrego. Se a chuva das próximas 3 horas passar do limite da área, quem tem um local salvo dentro do raio recebe o alerta — com sirene, o abrigo mais perto e a rota.',
    // mesmo texto e distancia que o backend calcula para a casa da Dona Cida no seed
    alerta: 'Vai chover forte perto de Casa.',
    abrigo: 'Vá para o abrigo: 465 m.',
    passos: ['Previsão passa do limite', 'Área de risco acende', 'Alerta chega no celular', 'Rota até o abrigo'],
    fonte: 'Previsão horária: Open-Meteo. Regra: soma da chuva das próximas 3 h ≥ limite da área.',
  },

  impacto: {
    titulo: 'Impacto que o próprio sistema mede',
    texto: 'Ao vivo, na UBS de referência. Cada número sobe quando uma vaga é recuperada ou um morador é avisado.',
    fallback: 'O servidor está acordando — os números ao vivo aparecem em instantes.',
  },

  ecossistema: {
    titulo: 'Um nó que liga quem já existe',
    nos: [
      { id: 'cidadao', nome: 'Cidadão', papel: 'Fala com o Zelo por voz ou texto' },
      { id: 'ubs', nome: 'UBS', papel: 'Agenda, fila e vagas recuperadas' },
      { id: 'secretaria', nome: 'Secretaria de Saúde', papel: 'Indicadores de impacto da rede' },
      { id: 'defesa', nome: 'Defesa Civil', papel: 'Áreas de risco e abrigos' },
      { id: 'meteo', nome: 'Open-Meteo', papel: 'Previsão de chuva hora a hora' },
    ],
  },

  ods: [
    { numero: 3, nome: 'Saúde e Bem-Estar', cor: '#4C9F38', contribuicao: 'Recupera consultas que ficariam vazias e encurta a espera de quem está na fila.' },
    { numero: 10, nome: 'Redução das Desigualdades', cor: '#DD1367', contribuicao: 'Voz, letra grande e prioridade legal: funciona para quem lê com dificuldade.' },
    { numero: 11, nome: 'Cidades e Comunidades Sustentáveis', cor: '#FD9D24', contribuicao: 'Avisa moradores de áreas de risco e indica o abrigo mais perto com rota.' },
    { numero: 13, nome: 'Ação Contra a Mudança do Clima', cor: '#3F7E44', contribuicao: 'Transforma previsão de chuva extrema em ação antes do alagamento.' },
  ] as Ods[],

  fechamento: {
    frase: ['Ninguém perde a vez.', 'Ninguém é pego de surpresa.'],
    cta: 'Ver o Zelo funcionando',
    // PREENCHER: nomes e RMs da equipe (ver TODO-EQUIPE.md). Nao inventar.
    equipe: [] as Membro[],
  },

  rodape: {
    dados: 'Pacientes e telefones fictícios · Modelo de risco treinado em base pública real (Kaggle, 2016)',
  },
}

export const fmtPct = (v: number) => pct(v, 0)
