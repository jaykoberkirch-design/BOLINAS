const WEBP = "assets/images/webp";
const SKIP = new Set([25, 26]);
const FEATURED = [0, 6, 11, 16, 21, 28, 42, 48];
const SEO_BRAND = "Bolinas Media";
const SEO_REGION = "Sonoma County and the North Bay";

const GALLERY_SCENES = [
  "living room interior with natural light",
  "gourmet kitchen and center island",
  "primary bedroom suite",
  "spa-style bathroom",
  "front exterior elevation",
  "backyard and outdoor living space",
  "aerial drone property overview",
  "twilight exterior marketing photo",
  "dining room and entertaining area",
  "open-concept great room",
  "covered patio and outdoor kitchen",
  "home office and built-in workspace",
  "guest bedroom interior",
  "wine country foyer and entry",
  "staircase and architectural millwork",
  "pool terrace and lounge area",
  "garage and driveway approach",
  "Sonoma hillside landscape view",
  "primary bathroom vanity detail",
  "chef's kitchen appliance wall",
  "master closet and dressing area",
  "family room with fireplace",
  "breakfast nook and morning light",
  "front porch and curb appeal",
  "vineyard estate rear elevation",
];

const GALLERY_TONES = ["Bright editorial", "Luxury listing", "Marketing-ready"];

function buildGalleryAlt(photoNumber, index) {
  const scene = GALLERY_SCENES[index % GALLERY_SCENES.length];
  const tone = GALLERY_TONES[Math.floor(index / GALLERY_SCENES.length) % GALLERY_TONES.length];
  return `${tone} ${scene} — ${SEO_REGION} real estate photography by ${SEO_BRAND} (photo ${photoNumber})`;
}

const galleryImages = Array.from({ length: 51 }, (_, index) => index + 1)
  .filter((number) => !SKIP.has(number))
  .map((number, index) => {
    const id = String(number).padStart(2, "0");
    const stem = `image-${id}`;
    return {
      stem,
      alt: buildGalleryAlt(id, index),
      label: `Frame ${id}`,
      sm: `${WEBP}/${stem}-sm.webp`,
      lg: `${WEBP}/${stem}-lg.webp`,
    };
  });

const lightboxState = { currentIndex: 0 };
const prefetchCache = new Set();

function prefetchImage(src) {
  if (prefetchCache.has(src)) {
    return;
  }
  prefetchCache.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

function createCard(image, index, masonry) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = masonry ? "gallery-card gallery-card--masonry" : "gallery-card";
  card.dataset.lightboxTrigger = "true";
  card.dataset.index = String(index);
  card.setAttribute("aria-label", `Open ${image.label}`);

  const img = document.createElement("img");
  img.src = image.sm;
  img.srcset = `${image.sm} 840w, ${image.lg} 1920w`;
  img.sizes = masonry
    ? "(max-width: 760px) 100vw, (max-width: 980px) 50vw, 33vw"
    : "(max-width: 760px) 100vw, (max-width: 980px) 50vw, 58vw";
  img.alt = image.alt;
  img.decoding = "async";
  img.loading = index < (masonry ? 8 : 2) ? "eager" : "lazy";
  if (!masonry && index === 0) {
    img.fetchPriority = "high";
  }

  card.append(img);
  return card;
}

function updateGalleryCounts() {
  document.querySelectorAll("[data-gallery-count]").forEach((node) => {
    node.textContent = String(galleryImages.length);
  });
}

function renderFeaturedGallery() {
  const container = document.querySelector("[data-home-gallery]");
  if (!container) {
    return;
  }

  FEATURED.forEach((index) => {
    container.append(createCard(galleryImages[index], index, false));
  });
}

function renderFullGallery() {
  const container = document.querySelector("[data-gallery-grid]");
  if (!container) {
    return;
  }

  galleryImages.forEach((image, index) => {
    container.append(createCard(image, index, true));
  });
}

function updateFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(year);
  });
}

function openLightbox(index) {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) {
    return;
  }

  lightboxState.currentIndex = index;
  updateLightbox();
  lightbox.hidden = false;
  document.body.classList.add("modal-open");
}

function closeLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) {
    return;
  }

  lightbox.hidden = true;
  document.body.classList.remove("modal-open");
}

function stepLightbox(direction) {
  lightboxState.currentIndex =
    (lightboxState.currentIndex + direction + galleryImages.length) % galleryImages.length;
  updateLightbox();
}

function prefetchLightboxNeighbors() {
  const { currentIndex } = lightboxState;
  const total = galleryImages.length;
  prefetchImage(galleryImages[(currentIndex + 1) % total].lg);
  prefetchImage(galleryImages[(currentIndex - 1 + total) % total].lg);
}

function updateLightbox() {
  const image = galleryImages[lightboxState.currentIndex];
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");

  if (!image || !lightboxImage || !lightboxCaption) {
    return;
  }

  lightboxImage.src = image.lg;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = `${image.label} of ${galleryImages.length}`;
  prefetchLightboxNeighbors();
}

function initLightbox() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-trigger]");
    if (trigger) {
      openLightbox(Number(trigger.dataset.index));
      return;
    }

    if (event.target.closest("[data-lightbox-close]")) {
      closeLightbox();
      return;
    }

    if (event.target.closest("[data-lightbox-prev]")) {
      stepLightbox(-1);
      return;
    }

    if (event.target.closest("[data-lightbox-next]")) {
      stepLightbox(1);
      return;
    }

    const lightbox = document.querySelector("[data-lightbox]");
    if (lightbox && !lightbox.hidden && event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    const lightbox = document.querySelector("[data-lightbox]");
    if (!lightbox || lightbox.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      stepLightbox(-1);
    } else if (event.key === "ArrowRight") {
      stepLightbox(1);
    }
  });
}

function initBrandMarkCursor() {
  const brand = document.querySelector(".brand");
  const mark = document.querySelector(".brand-mark");
  if (!brand || !mark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const maxTilt = 26;

  function updateTilt(clientX, clientY) {
    const rect = mark.getBoundingClientRect();
    const percentX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const percentY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const rotateY = Math.max(-maxTilt, Math.min(maxTilt, percentX * maxTilt));
    const rotateX = Math.max(-maxTilt, Math.min(maxTilt, -percentY * maxTilt));
    mark.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(6px)`;
  }

  brand.addEventListener("mouseenter", (event) => {
    brand.classList.add("is-tilting");
    updateTilt(event.clientX, event.clientY);
  });
  brand.addEventListener("mousemove", (event) => updateTilt(event.clientX, event.clientY));
  brand.addEventListener("mouseleave", () => {
    brand.classList.remove("is-tilting");
    mark.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}

function initHeroVideo() {
  const video = document.querySelector(".hero-video");
  if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const start = () => {
    if (video.dataset.ready) {
      return;
    }
    video.dataset.ready = "true";
    video.preload = "auto";
    video.load();
    video.play().catch(() => {});
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
        }
      },
      { rootMargin: "120px" }
    ).observe(video);
  } else {
    start();
  }
}

function init() {
  renderFeaturedGallery();
  renderFullGallery();
  updateGalleryCounts();
  updateFooterYear();
  initLightbox();
  initBrandMarkCursor();
  initHeroVideo();
}

init();
