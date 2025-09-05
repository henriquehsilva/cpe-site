import React, { useEffect, useRef, useState } from 'react'

/**
 * History (refatorado em BLOCOs e mais operacional)
 * - Componente desacoplado e configurável por props
 * - Subcomponentes para header, track, slides, controles, indicadores e chips de período
 * - Suporte a teclado (← →), toque/arraste, e callbacks (onSlideChange)
 * - Mantém compatibilidade visual com classes utilitárias existentes (bg-cpe-dark, cpe-red etc.)
 */

// ------------------------------------------------------
// Tipos e utilitários
// ------------------------------------------------------
export type HistorySlideData = {
  id: string | number
  title: string
  content: string
}

export type HistoryTheme = {
  /** Classe do bg da seção */
  sectionBg?: string
  /** Painel principal (bg/border) */
  panelBg?: string
  panelBorder?: string
  /** Cor de destaque (dots/linhas/badges) */
  accent?: string
  /** Cartão do slide (bg/border) */
  slideCardBg?: string
  slideCardBorder?: string
  /** Cores de texto/botões */
  titleColor?: string
  textColor?: string
  btnBorder?: string
  btnText?: string
  focusRing?: string
}

const defaultTheme: Required<HistoryTheme> = {
  sectionBg: 'bg-cpe-dark',
  panelBg: 'bg-cpe-gray/20',
  panelBorder: 'border-cpe-gray/30',
  accent: 'bg-cpe-red',
  slideCardBg: 'bg-black/20',
  slideCardBorder: 'border-white/5',
  titleColor: 'text-white/90',
  textColor: 'text-gray-300',
  btnBorder: 'border-white/10',
  btnText: 'text-white/90',
  focusRing: 'focus:ring-cpe-red/60',
}

const cx = (...parts: Array<string | false | undefined | null>) => parts.filter(Boolean).join(' ')
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max))

// ------------------------------------------------------
// Conteúdo padrão (pode ser sobrescrito via props.slides)
// ------------------------------------------------------
const defaultSlides: HistorySlideData[] = [
  {
    id: 1,
    title: '1990–1993 · Ronda Bancária → ROTAM',
    content:
      'No ano de 1990, com a necessidade de um policiamento que desse maior sensação de segurança na área central, comercial e bancária de Anápolis/GO, foi criado, na Unidade do 4º Batalhão de Polícia Militar – 4º BPM, um grupo denominado de “RONDA BANCÁRIA”, com um efetivo inicial de 08 (oito) policiais militares, ficando estes subordinados à 2ª Companhia Operacional do 4º BPM, sendo que em 1993, referido grupo passou a ser chamado de “ROTAM”, tendo como primeiro Comandante o Tenente PM Edival Soares Batista, em alusão à 1ª Companhia de Rotam do Batalhão de Choque da capital goiana.',
  },
  {
    id: 2,
    title: '1997–2000 · ROTAM → GOE; 1º CPT',
    content:
      'Em 1997, com o Tenente PM Marcos Vinícius Pinto Batista, possuidor do Curso de Operações Especiais, no comando, o grupo denominado de ROTAM foi renomeado para Grupo de Operações Especiais – GOE, contando, então, com um efetivo de 12 (doze) policiais militares. Ainda no ano 2000, o Soldado PM Sidney Rodrigues Uessugi foi enviado à Goiânia/GO para realizar o 1º Curso de Patrulhamento Tático – CPT do Estado de Goiás, ministrado pela 1ª Companhia de Rotam no Batalhão de Choque e em 05 de abril daquele ano ele retornou como o primeiro patrulheiro tático a servir no GOE.',
  },
  {
    id: 3,
    title: '2001–2002 · Equipe cursada; COE',
    content:
      'Em 2001, visando sempre aprimorar a capacidade técnica do efetivo do GOE, foram enviados mais policiais militares à capital goiana para se especializarem no Curso de Patrulhamento Tático – CPT, quais sejam, o Sargento PM Giuliano Dourado, Soldado PM Odimar Cipione Capucio, Cabo PM Esenhower Santos de Souza e Soldado PM Samuel Rodrigues da Silva, possibilitando, assim, a criação de uma equipe totalmente cursada. Em meados de 2002, o Comandante do 4º BPM incorporou os grupos do GOE e GIRO à 3ª Companhia Operacional e designou para o comando o Capitão PM César Otávio Valente. Assim, passou a ser chamada de Companhia de Operações Especiais – COE, ocupando as instalações na entrada do 3° Comando Regional de Polícia Militar – 3º CRPM.',
  },
  {
    id: 4,
    title: '2003 · Doutrina de Patrulhamento Tático',
    content:
      'Em 2003, já sob o Comando do Tenente PM Elói Moreira Farinha, visando uma tropa mais homogênea e com mais preparo técnico profissional, outros policiais militares componentes do GOE foram encaminhados ao Batalhão de Choque e ROTAM na capital goiana, a fim de participarem de Estágios do Curso de Patrulhamento 2 Tático – CPT e do Curso Operacional de ROTAM – COR, respectivamente, passando o GOE a seguir, definitivamente, a Doutrina de Patrulhamento Tático.',
  },
  {
    id: 5,
    title: '2004–2012 · Estrutura, 31ª CIPM, CPE e GPT',
    content:
      'Visando atender aos anseios da sociedade Anapolina e em reconhecimento às diversas atuações desta tropa especializada no combate à criminalidade que outrora se expandia gradativamente, após estudos e planejamentos junto aos empresários, autoridades civis e militares, no ano de 2004, foi possível buscar os benefícios para a estruturação das instalações físicas, administrativa e operacional da COE em uma área doada pela Prefeitura Municipal de Anápolis, na Av. A, Quadra 08, Lote 01, Cidade Jardim, passando a ser uma Companhia destacada do 4º BPM. Em 30 de março de 2010, a COE do 4º BPM, conseguiu sua independência passando a ser denominada de Trigésima Primeira Companhia Independente de Polícia Militar – 31ª CIPM. E, como consequência de seu policiamento, foi criada a primeira Companhia de Policiamento Especializado –CPE do Estado de Goiás. Assim, transformou-se o GOE em Grupo de Patrulhamento Tático – GPT, sendo designado o Major PM Jackson Luzo Conceição Araújo para o comando.',
  },
  {
    id: 6,
    title: '2012 · 16º CPT e efetivo cursado',
    content:
      'Sempre visando o crescimento operacional da CPE, em 02 de julho de 2012, na sede da 31ª CIPM / CPE, sob a coordenação do Capitão PM Luciano Souza Magalhães, subcoordenação do Tenente PM Joceli Machado Júnior e monitoria do Subtenente PM Giuliano Dourado e dos Soldados PM Sidney Rodrigues Uessugi e Thiago Francisco Marchetti N. Bandeira foi realizado o 16º Curso de Patrulhamento Tático – CPT, Nível Praça, sendo o primeiro CPT realizado dentro de uma BASE CPE. Assim, em 30 de agosto de 2012, 39 (trinta e nove) praças formaram e se tornaram patrulheiros táticos e, com isso, todo o efetivo da CPE se tornou cursado. A partir daí o policiamento especializado da cidade de Anápolis/GO, bem como as cidades circunvizinhas vive uma constante evolução, se preparando diuturnamente para o combate à criminalidade.',
  },
  {
    id: 7,
    title: '2018 · Regimento Interno 31ª CIPM/CPE',
    content:
      'Como forma de reconhecimento aos relevantes serviços prestados pela 31ª CIPM – Companhia de Policiamento Especializado, foi aprovado pelo Exmo. Senhor Coronel PM Silvio Vasconcelos Nunes – Comandante Geral da PMGO, a portaria nº 11417, datada de 20 de dezembro de 2018, regulamentando no âmbito da Policia Militar do Estado de Goiás, o Regimento Interno da 31ª CIPM/CPE – Companhia de Policiamento Especializado.',
  },
]

// ------------------------------------------------------
// Hook: lógica de carrossel (index, movimento, teclado, toque)
// ------------------------------------------------------
function useCarousel(length: number, initial = 0, onChange?: (i: number) => void) {
  const [index, setIndex] = useState(initial)
  const trackRef = useRef<HTMLDivElement>(null)
  const startX = useRef<number | null>(null)
  const deltaX = useRef(0)
  const dragging = useRef(false)

  const goTo = (i: number) => setIndex((prev) => clamp(typeof i === 'number' ? i : prev, 0, length - 1))
  const prev = () => goTo(index - 1)
  const next = () => goTo(index + 1)

  // teclado
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev() }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [index])

  // toque/arraste
  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    dragging.current = true
    startX.current = e.clientX
    deltaX.current = 0
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return
    deltaX.current = e.clientX - startX.current
    if (trackRef.current) {
      const w = trackRef.current.clientWidth
      const offset = -index * 100 + (deltaX.current / w) * 100
      trackRef.current.style.transform = `translateX(${offset}%)`
    }
  }
  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    const threshold = 50
    if (deltaX.current > threshold) prev()
    else if (deltaX.current < -threshold) next()
    else if (trackRef.current) trackRef.current.style.transform = `translateX(${-index * 100}%)`
    startX.current = null
    deltaX.current = 0
  }

  // transição suave a cada mudança de index
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 300ms ease'
      trackRef.current.style.transform = `translateX(${-index * 100}%)`
      const t = setTimeout(() => trackRef.current && (trackRef.current.style.transition = ''), 320)
      return () => clearTimeout(t)
    }
  }, [index])

  useEffect(() => { onChange?.(index) }, [index])

  return { index, goTo, prev, next, trackRef, containerRef, onPointerDown, onPointerMove, onPointerUp }
}

// ------------------------------------------------------
// BLOCO A: Cabeçalho (escudo + faixa)
// ------------------------------------------------------
function HistoryHeader({ logoSrc, accentClass }: { logoSrc?: string; accentClass: string }) {
  return (
    <div className="text-center mb-10">
      {logoSrc && (
        <img
          src={logoSrc}
          alt="Escudo da CPE Anápolis"
          className="w-64 h-48 sm:w-28 sm:h-20 lg:w-32 lg:h-24 mx-auto mb-4 drop-shadow-2xl"
        />
      )}
      <div className={cx('w-24 h-1 mx-auto', accentClass)} />
    </div>
  )
}

// ------------------------------------------------------
// BLOCO B: Slide individual
// ------------------------------------------------------
function SlideCard({ title, content, theme }: { title: string; content: string; theme: Required<HistoryTheme> }) {
  return (
    <article className="shrink-0 w-full p-6 md:p-10">
      <div className={cx('rounded-xl p-6 md:p-8 lg:p-10 shadow-xl border', theme.slideCardBg, theme.slideCardBorder)}>
        <h3 className={cx('text-lg md:text-xl font-semibold flex items-center gap-3', theme.titleColor)}>
          <span className={cx('inline-block w-2 h-2 rounded-full', theme.accent)} />
          {title}
        </h3>
        <p className={cx('mt-4 leading-relaxed text-justify', theme.textColor)}>{content}</p>
      </div>
    </article>
  )
}

// ------------------------------------------------------
// BLOCO C: Indicadores (dots)
// ------------------------------------------------------
function Dots({ length, index, setIndex, accentClass }: { length: number; index: number; setIndex: (i: number) => void; accentClass: string }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      {Array.from({ length }).map((_, i) => (
        <button
          key={`dot-${i}`}
          onClick={() => setIndex(i)}
          className={cx(
            'rounded-full transition-all',
            // targets maiores no mobile, mantendo visual no desktop
            i === index
              ? cx(accentClass, 'h-3 w-8 md:h-2 md:w-10')
              : 'bg-white/40 h-3 w-3 md:h-2 md:w-2 hover:bg-white/60'
          )}
          aria-label={`Ir para o slide ${i + 1}`}
        />
      ))}
    </div>
  )
}

// ------------------------------------------------------
// BLOCO D: Chips por período (>= md)
// ------------------------------------------------------
function PeriodChips({ slides, index, setIndex, theme }: { slides: HistorySlideData[]; index: number; setIndex: (i: number) => void; theme: Required<HistoryTheme> }) {
  return (
    <div className="hidden md:flex flex-wrap gap-2 px-4 pb-6">
      {slides.map((s, i) => (
        <button
          key={`chip-${s.id}`}
          onClick={() => setIndex(i)}
          className={cx(
            'text-xs px-3 py-1 rounded-full border transition',
            i === index ? cx(theme.accent, 'text-white border-cpe-red') : cx(theme.btnText, theme.btnBorder, 'hover:bg-white/5')
          )}
          aria-label={`Selecionar período: ${s.title}`}
        >
          {s.title}
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------
// BLOCO E: Controles (anterior/próximo)
// ------------------------------------------------------
function Controls({ onPrev, onNext, theme }: { onPrev: () => void; onNext: () => void; theme: Required<HistoryTheme> }) {
  return (
    <div className="flex items-center justify-between gap-2 p-4 md:p-6">
      <button
        onClick={onPrev}
        className={cx('px-3 py-2 rounded-lg transition active:scale-95', 'hover:bg-white/5', theme.btnText, 'border', theme.btnBorder)}
        aria-label="Slide anterior"
      >
        ←
      </button>
      {/* espaço central ficará com os dots no componente pai */}
      <div className="w-full" />
      <button
        onClick={onNext}
        className={cx('px-3 py-2 rounded-lg transition active:scale-95', 'hover:bg-white/5', theme.btnText, 'border', theme.btnBorder)}
        aria-label="Próximo slide"
      >
        →
      </button>
    </div>
  )
}

// ------------------------------------------------------
// BLOCO F: Faixa dos slides (track + overflow)
// ------------------------------------------------------
function SlidesTrack({ slides, theme, trackRef }: { slides: HistorySlideData[]; theme: Required<HistoryTheme>; trackRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="overflow-hidden">
      <div
        ref={trackRef}
        className="flex w-full"
        aria-live="polite"
        style={{ willChange: 'transform' }}
      >
        {slides.map((s) => (
          <SlideCard key={s.id} title={s.title} content={s.content} theme={theme} />
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------
// Props principais do componente History
// ------------------------------------------------------
export type HistoryProps = {
  id?: string
  logoSrc?: string
  slides?: HistorySlideData[]
  theme?: HistoryTheme
  className?: string
  showDots?: boolean
  showChips?: boolean
  initialIndex?: number
  onSlideChange?: (i: number) => void
  ariaLabel?: string
}

// ------------------------------------------------------
// Componente principal (seção História)
// ------------------------------------------------------
const History: React.FC<HistoryProps> = ({
  id = 'historia',
  logoSrc = '/logo_2.png',
  slides = defaultSlides,
  theme = {},
  className,
  showDots = true,
  showChips = true,
  initialIndex = 0,
  onSlideChange,
  ariaLabel = 'Linha do tempo da história da CPE Anápolis',
}) => {
  const th = { ...defaultTheme, ...theme }
  const { index, prev, next, goTo, trackRef, containerRef, onPointerDown, onPointerMove, onPointerUp } =
    useCarousel(slides.length, initialIndex, onSlideChange)

  return (
    <section id={id} className={cx('py-20', th.sectionBg, className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BLOCO A: Cabeçalho */}
        <img src="/logo_2.png" alt="Escudo da CPE Anápolis" className="w-64 h-48 sm:w-28 sm:h-20 lg:w-96 lg:h-64 mx-auto mb-4 drop-shadow-2xl" />

        {/* Container do carrossel */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-label={ariaLabel}
          className={cx(
            'rounded-lg border p-0 focus:outline-none',
            th.panelBg, th.panelBorder, th.focusRing,
            // melhorias de experiência no mobile (sem alterar desktop)
            'touch-pan-y select-none overscroll-x-contain cursor-grab active:cursor-grabbing md:cursor-auto'
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* BLOCO F: Slides */}
          <SlidesTrack slides={slides} theme={th} trackRef={trackRef} />

          {/* BLOCO E + C: Controles + Dots no centro */}
          <div className="flex items-center gap-2 p-4 md:p-6">
            <button
              onClick={prev}
              className={cx('px-3 py-2 rounded-lg transition active:scale-95', 'hover:bg-white/5', th.btnText, 'border', th.btnBorder)}
              aria-label="Slide anterior"
            >
              ←
            </button>
            <div className="flex-1 flex justify-center">
              {showDots && <Dots length={slides.length} index={index} setIndex={goTo} accentClass={th.accent} />}
            </div>
            <button
              onClick={next}
              className={cx('px-3 py-2 rounded-lg transition active:scale-95', 'hover:bg-white/5', th.btnText, 'border', th.btnBorder)}
              aria-label="Próximo slide"
            >
              →
            </button>
          </div>

          {/* BLOCO D: Chips por período */}
          {showChips && <PeriodChips slides={slides} index={index} setIndex={goTo} theme={th} />}
        </div>

        {/* Dica de acessibilidade */}
        <p className="mt-4 text-xs text-gray-400 text-center">
          Dica: use as setas do teclado (← →) ou arraste no celular para navegar pelos períodos.
        </p>
      </div>
    </section>
  )
}

export default History
