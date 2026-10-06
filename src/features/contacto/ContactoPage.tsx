import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import styles from './ContactoPage.module.css'

export function ContactoPage() {
  const store = useStorefrontContext()

  return (
    <StorePageLayout>
      <main className={styles.page}>
        <section className={styles.contact} aria-labelledby="contact-title">
          <div className={styles.contactContent}>
            <p className="eyebrow">Estamos para ayudarte</p>
            <h1 id="contact-title" className={styles.title}>Hablemos de tu próximo espacio.</h1>
            <p className={styles.copy}>
              ¿Estás buscando el acabado ideal o recién empiezas a imaginar tu proyecto? En Cerámax puedes explorar opciones, comparar sus detalles y elegir con calma.
            </p>
            <p className={styles.contactNote}>
              Estamos preparando nuestros canales de contacto. Por ahora, puedes conocer los productos disponibles directamente en la tienda.
            </p>
            <button type="button" className="primary-button mt-7" onClick={() => store.navigate('/productos')}>
              Explorar productos
            </button>
          </div>
          <img
            className={styles.contactImage}
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85"
            alt="Sala luminosa con materiales y tonos naturales"
            loading="lazy"
          />
        </section>

        <section className={styles.about} aria-labelledby="about-title">
          <div className={styles.aboutImageWrap}>
            <img
              className={styles.aboutImage}
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"
              alt="Espacio interior contemporáneo con acabados cálidos"
              loading="lazy"
            />
            <span className={styles.imageCaption}>Materiales que hacen suyo cada espacio.</span>
          </div>

          <div className={styles.aboutContent}>
            <p className="eyebrow">Conócenos</p>
            <h2 id="about-title" className={styles.sectionTitle}>Quiénes somos</h2>
            <p className={styles.copy}>
              En Cerámax creemos que los materiales correctos ayudan a convertir una idea en un espacio para disfrutar. Por eso reunimos en nuestra tienda un catálogo que puedes recorrer a tu ritmo, desde la inspiración hasta los detalles de cada producto.
            </p>
            <h3 className={styles.howTitle}>Una forma sencilla de empezar</h3>
            <div className={styles.steps}>
              <article>
                <span>01</span>
                <h4>Inspírate</h4>
                <p>Recorre las categorías y encuentra opciones para tu proyecto.</p>
              </article>
              <article>
                <span>02</span>
                <h4>Conoce los detalles</h4>
                <p>Revisa la información disponible de cada producto antes de elegir.</p>
              </article>
              <article>
                <span>03</span>
                <h4>Arma tu selección</h4>
                <p>Guarda tus favoritos o agrégalos al carrito para continuar.</p>
              </article>
            </div>
            <button type="button" className={styles.textLink} onClick={() => store.navigate('/productos')}>
              Descubrir la tienda <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>
    </StorePageLayout>
  )
}
