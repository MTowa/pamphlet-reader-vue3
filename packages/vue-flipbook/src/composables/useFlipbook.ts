import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FlipEngine, FlipEngineOptions } from '../adapters/FlipEngine'
import type { PdfDocumentSession } from '../pdf/PdfDocumentSession'
import type { SvgDocumentSession } from '../svg/SvgDocumentSession'
import { PageRenderQueue } from '../rendering/PageRenderQueue'
import { clampPage, renderWindow, visiblePages } from '../utils/pages'
import { FlipbookError } from '../types'
import type {
  FlipbookLoading,
  FlipbookPageChange,
  FlipbookReady,
  FlipbookViewerProps,
  FlipbookViewMode,
} from '../types'

interface Callbacks {
  ready(payload: FlipbookReady): void
  change(payload: FlipbookPageChange): void
  loading(payload: FlipbookLoading): void
  error(error: FlipbookError): void
}

type ResolvedProps = Required<Omit<FlipbookViewerProps, 'src' | 'svgDir'>> &
  Pick<FlipbookViewerProps, 'src' | 'svgDir'>
export function useFlipbook(props: ResolvedProps, callbacks: Callbacks) {
  const root = ref<HTMLElement>()
  const stage = ref<HTMLElement>()
  const loading = ref(true)
  const failure = ref<FlipbookError>()
  const pageCount = ref(0)
  const currentPage = ref(1)
  const mode = ref<FlipbookViewMode>('spread')
  const fullscreen = ref(false)
  const fullscreenSupported = ref(false)
  const shownPages = computed(() =>
    pageCount.value
      ? visiblePages(currentPage.value, pageCount.value, mode.value, props.showCover)
      : [],
  )
  const canPrevious = computed(() => currentPage.value > 1 && !loading.value)
  const canNext = computed(() => (shownPages.value.at(-1) ?? 0) < pageCount.value && !loading.value)

  let mounted = false
  let epoch = 0
  let session: PdfDocumentSession | SvgDocumentSession | undefined
  let queue: PageRenderQueue | undefined
  let engine: FlipEngine | undefined
  let createEngine: ((options: FlipEngineOptions) => FlipEngine) | undefined
  let observer: ResizeObserver | undefined
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  let containers: HTMLElement[] = []
  let aspectRatio = 1 / Math.sqrt(2)
  let pageWidth = 1,
    pageHeight = 1
  let layoutKey = ''
  let turning = false
  let pendingLayout = false
  let readySent = false

  const payload = (): FlipbookPageChange => ({
    page: currentPage.value,
    pageCount: pageCount.value,
    visiblePages: [...shownPages.value],
    mode: mode.value,
  })
  const progress = (active: boolean, loaded = 0, total: number | null = null) => {
    loading.value = active
    callbacks.loading({ loading: active, loaded, total })
  }
  const renderNearby = () =>
    queue?.update(renderWindow(shownPages.value, pageCount.value), pageWidth, pageHeight)
  const checkReady = () => {
    if (
      !readySent &&
      shownPages.value.length &&
      shownPages.value.every((page) => containers[page - 1]?.dataset.rendered === 'true')
    ) {
      readySent = true
      progress(false)
      callbacks.ready({ ...payload(), aspectRatio })
    }
  }

  async function disposeResources() {
    engine?.destroy()
    engine = undefined
    queue?.destroy()
    queue = undefined
    const previous = session
    session = undefined
    containers = []
    stage.value?.replaceChildren()
    layoutKey = ''
    turning = false
    pendingLayout = false
    await previous?.destroy()
  }

  function reportError(code: 'load' | 'render', cause: unknown) {
    const message =
      code === 'load'
        ? props.svgDir
          ? 'SVGを読み込めませんでした。フォルダーのパスとページ一覧の生成設定を確認してください。'
          : 'PDFを読み込めませんでした。ファイルとURL、配信元のアクセス設定を確認してください。'
        : 'ページを描画できませんでした。もう一度読み込んでください。'
    failure.value = new FlipbookError(code, message, cause)
    progress(false)
    callbacks.error(failure.value)
    void disposeResources().catch(() => {
      /* Original error remains visible. */
    })
  }

  function layout() {
    if (!mounted || !stage.value || !createEngine || !pageCount.value || !queue) return
    if (turning) {
      pendingLayout = true
      return
    }
    const bounds = stage.value.getBoundingClientRect()
    if (bounds.width < 16 || bounds.height < 16) return
    const nextMode = bounds.width < props.mobileBreakpoint ? 'single' : 'spread'
    const width = Math.max(
      1,
      Math.floor(
        Math.min(
          (bounds.width - 24) / (nextMode === 'single' ? 1 : 2),
          (bounds.height - 24) * aspectRatio,
        ),
      ),
    )
    const height = Math.max(1, Math.floor(width / aspectRatio))
    const key = `${width}:${height}:${nextMode}:${props.showCover}:${props.flipDuration}`
    if (key === layoutKey) return
    layoutKey = key
    engine?.destroy()
    engine = undefined
    pageWidth = width
    pageHeight = height
    mode.value = nextMode
    // The engine owns this entire subtree; Vue never reconciles its moving pages.
    const host = document.createElement('div')
    host.className = 'vfb__book'
    host.style.width = `${width * (nextMode === 'single' ? 1 : 2)}px`
    host.style.height = `${height}px`
    containers = Array.from({ length: pageCount.value }, (_, index) => {
      const page = document.createElement('div')
      page.className = 'vfb__page'
      page.dataset.page = String(index + 1)
      page.setAttribute('role', 'img')
      page.setAttribute('aria-label', `${props.svgDir ? 'SVG' : 'PDF'} ${index + 1}ページ`)
      const paper = document.createElement('div')
      paper.className = 'vfb__paper'
      const placeholder = document.createElement('span')
      placeholder.className = 'vfb__placeholder'
      placeholder.textContent = String(index + 1).padStart(2, '0')
      paper.append(placeholder)
      page.append(paper)
      return page
    })
    host.append(...containers)
    stage.value.replaceChildren(host)
    const previousPage = currentPage.value
    const startPage = visiblePages(previousPage, pageCount.value, nextMode, props.showCover)[0]!
    engine = createEngine({
      host,
      pages: containers,
      pageWidth,
      pageHeight,
      mode: nextMode,
      showCover: props.showCover,
      startPage,
      duration: props.flipDuration,
      onPageChange(page) {
        currentPage.value = visiblePages(page, pageCount.value, mode.value, props.showCover)[0]!
        for (let i = 0; i < containers.length; i++)
          containers[i]!.setAttribute('aria-hidden', String(!shownPages.value.includes(i + 1)))
        renderNearby()
        callbacks.change(payload())
      },
      onStateChange(busy) {
        turning = busy
        if (!busy) {
          renderNearby()
          if (pendingLayout) {
            pendingLayout = false
            scheduleLayout()
          }
        }
      },
    })
    currentPage.value = startPage
    queue.reattach()
    renderNearby()
    checkReady()
  }

  function scheduleLayout() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(layout, 100)
  }

  async function reload() {
    if (!mounted) return
    const ownEpoch = ++epoch
    failure.value = undefined
    pageCount.value = 0
    readySent = false
    progress(true)
    try {
      await disposeResources()
      const source = props.src,
        directory = props.svgDir
      if (Boolean(source) === Boolean(directory))
        throw new Error('Specify exactly one of src and svgDir.')
      const [document, flip] = await Promise.all([
        directory
          ? import('../svg/SvgDocumentSession').then(({ SvgDocumentSession }) => {
              const session = new SvgDocumentSession()
              return { session, open: () => session.open(directory) }
            })
          : import('../pdf/PdfDocumentSession').then(({ PdfDocumentSession }) => {
              const session = new PdfDocumentSession()
              return {
                session,
                open: () =>
                  session.open(source!, (loaded, total) => {
                    if (mounted && ownEpoch === epoch) progress(true, loaded, total)
                  }),
              }
            }),
        import('../adapters/stPageFlip'),
      ])
      if (!mounted || ownEpoch !== epoch) {
        await document.session.destroy()
        return
      }
      createEngine = flip.createFlipEngine
      const documentSession = document.session
      session = documentSession
      const metadata = await document.open()
      if (!mounted || ownEpoch !== epoch) {
        await documentSession.destroy()
        return
      }
      pageCount.value = metadata.pageCount
      aspectRatio = metadata.aspectRatio
      currentPage.value = clampPage(props.startPage, pageCount.value)
      queue = new PageRenderQueue(
        documentSession,
        (page, element) => {
          const paper = containers[page - 1]?.firstElementChild
          if (!paper) return
          paper.querySelector('.vfb__content')?.remove()
          element.classList.add('vfb__content')
          paper.append(element)
          containers[page - 1]!.dataset.rendered = 'true'
          checkReady()
        },
        (page) => {
          containers[page - 1]?.querySelector('.vfb__content')?.remove()
          if (containers[page - 1]) delete containers[page - 1]!.dataset.rendered
        },
        (cause) => {
          if (mounted && ownEpoch === epoch) reportError('render', cause)
        },
      )
      await nextTick()
      if (mounted && ownEpoch === epoch) layout()
    } catch (cause) {
      if (mounted && ownEpoch === epoch) reportError('load', cause)
    }
  }

  function nextPage() {
    if (canNext.value && !turning) engine?.next()
  }
  function prevPage() {
    if (canPrevious.value && !turning) engine?.previous()
  }
  function goToPage(page: number) {
    if (!loading.value && !turning) engine?.goTo(clampPage(page, pageCount.value))
  }
  function onKeydown(event: KeyboardEvent) {
    if (
      !props.keyboardNavigation ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return
    const target = event.target as HTMLElement
    if (target.isContentEditable || target.closest('input, textarea, select, button, a')) return
    const actions: Record<string, () => void> = {
      ArrowRight: nextPage,
      ArrowLeft: prevPage,
      PageDown: nextPage,
      PageUp: prevPage,
      Home: () => goToPage(1),
      End: () => goToPage(pageCount.value),
    }
    const action = actions[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }
  function onFullscreenChange() {
    fullscreen.value = document.fullscreenElement === root.value
    scheduleLayout()
  }
  async function toggleFullscreen() {
    try {
      if (fullscreen.value) await document.exitFullscreen()
      else await root.value?.requestFullscreen()
    } catch (cause) {
      callbacks.error(new FlipbookError('fullscreen', '全画面表示を開始できませんでした。', cause))
    }
  }

  onMounted(() => {
    mounted = true
    fullscreenSupported.value = Boolean(document.fullscreenEnabled && root.value?.requestFullscreen)
    observer = new ResizeObserver(scheduleLayout)
    if (stage.value) observer.observe(stage.value)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    void reload()
  })
  watch(
    () => [props.src, props.svgDir],
    () => {
      void reload()
    },
  )
  watch(
    () => props.startPage,
    (page) => goToPage(page),
  )
  watch(() => [props.showCover, props.mobileBreakpoint, props.flipDuration], scheduleLayout)
  onBeforeUnmount(() => {
    mounted = false
    epoch++
    clearTimeout(resizeTimer)
    observer?.disconnect()
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    void disposeResources().catch(() => {
      /* An interrupted load may already have rejected. */
    })
  })

  return {
    root,
    stage,
    loading,
    failure,
    pageCount,
    currentPage,
    mode,
    shownPages,
    canNext,
    canPrevious,
    fullscreen,
    fullscreenSupported,
    nextPage,
    prevPage,
    goToPage,
    reload,
    onKeydown,
    toggleFullscreen,
  }
}
