import React from "react";
import corteImg from "../assets/servicio-corte.jpg";
import barbaImg from "../assets/servicio-barba.jpg";
import afeitadoImg from "../assets/servicio-afeitado.jpg";

export default function HomePage({ onAgendarClick, onLoginClick }) {
  const servicios = [
    {
      titulo: "Corte de Cabello Clásico",
      descripcion: "Un corte atemporal adaptado a tu estilo.",
      imagen: corteImg,
    },
    {
      titulo: "Recorte y Perfilado de Barba",
      descripcion: "Cuidado de precisión para un look nítido y limpio.",
      imagen: barbaImg,
    },
    {
      titulo: "Afeitado con Toalla Caliente",
      descripcion:
        "La máxima experiencia de relajación y cuidado de la piel.",
      imagen: afeitadoImg,
    },
  ];

  const razones = [
    {
      titulo: "Todos los Requisitos",
      texto:
        "El proyecto cumple con todos los requisitos nesesarios para poder acreditar la materia.",
    },
    {
      titulo: "Vacaciones",
      texto:
        "Se pretende acreditar  la materia para poder disfrutas de unas vacaciones en fin de año.",
    },
    {
      titulo: "Estres",
      texto:
        "Estamos desesperados por liberar todas las materias que nos faltan para poder graduarnos.",
    },
  ];

  return (
    <div className="bg-fondo text-blanco-suave min-h-screen">

      {/* NAVBAR */}
      <header className="border-b border-panel-medio/70 bg-fondo sticky top-0 z-20">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-4 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wide">
            Barbería Clásica
          </span>

          <nav className="hidden md:flex gap-6 text-texto-secundario text-sm">
            <a href="#inicio" className="hover:text-blanco-suave transition">
              Inicio
            </a>
            <a href="#servicios" className="hover:text-blanco-suave transition">
              Servicios
            </a>
            <a href="#por-que" className="hover:text-blanco-suave transition">
              Barberos
            </a>
            <a href="#contacto" className="hover:text-blanco-suave transition">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onAgendarClick}
              className="px-5 py-2 rounded-full bg-crema text-negro-suave text-sm font-semibold hover:bg-blanco-suave transition"
            >
              Agendar Cita
            </button>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full border border-panel-medio text-sm text-blanco-suave hover:bg-panel-medio/60 transition"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="max-w-6xl xl:max-w-7xl mx-auto px-3 pt-8 pb-10"
      >
        <div className="relative rounded-2xl overflow-hidden h-[260px] md:h-[300px] lg:h-[320px]">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center blur-sm scale-105"
              style={{ backgroundImage: "url('/hero-barberia.jpg')" }}
            />
          </div>

          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#E5D4C338,transparent_55%)]" />

          <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight max-w-3xl">
              Experimenta el Arte del Cuidado Masculino
            </h2>
            <p className="mt-3 text-texto-secundario text-sm max-w-lg">
              Descubre servicios de barbería premium en un ambiente relajante.
              Calidad, tradición y estilo en cada corte.
            </p>
            <button
              onClick={onAgendarClick}
              className="mt-5 px-6 py-3 rounded-full bg-crema text-negro-suave text-sm font-semibold hover:bg-blanco-suave transition"
            >
              Agenda tu Cita Ahora
            </button>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="max-w-6xl xl:max-w-7xl mx-auto px-3 pb-10"
      >
        <h3 className="text-lg font-bold mb-4">Nuestros Servicios</h3>

        <div className="grid md:grid-cols-3 gap-4">
          {servicios.map((servicio) => (
            <article
              key={servicio.titulo}
              className="bg-panel-oscuro rounded-xl overflow-hidden border border-panel-medio/80"
            >
              <img
                src={servicio.imagen}
                alt={servicio.titulo}
                className="w-full h-36 object-cover"
              />

              <div className="p-3">
                <h4 className="text-sm font-semibold mb-1">{servicio.titulo}</h4>
                <p className="text-[11px] text-texto-secundario leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ¿POR QUÉ ELEGIRNOS? */}
      <section
        id="por-que"
        className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-10"
      >
        <h3 className="text-2xl font-bold mb-2">¿Por qué acreditarnos?</h3>
        <p className="text-sm text-texto-secundario max-w-xl mb-6">
          A continuacion se presentar las razones por las cuales se deberia acreditar la materiax
          Ecosistema Nosql: Teoría Y Práctica Con Mongodb.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {razones.map((razon) => (
            <div
              key={razon.titulo}
              className="bg-panel-oscuro rounded-xl border border-panel-medio/80 p-4 text-sm"
            >
              <h4 className="font-semibold mb-2">{razon.titulo}</h4>
              <p className="text-[11px] text-texto-secundario leading-relaxed">
                {razon.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="max-w-6xl xl:max-w-7xl mx-auto px-3 py-12">
        <h3 className="text-center text-2xl font-bold mb-8">
          Lo que dicen nuestros clientes
        </h3>

        <div className="bg-panel-oscuro border border-panel-medio rounded-xl max-w-2xl mx-auto px-8 py-10 text-center text-sm text-texto-secundario">
          <p className="italic mb-4">
            "El mejor corte que he tenido en años. La atención al detalle es
            increíble y el ambiente es genial. Volveré sin duda."
          </p>
          <p className="font-semibold text-blanco-suave">- Carlos M.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contacto"
        className="border-t border-panel-medio/70 pt-10 pb-6 text-xs text-texto-secundario"
      >
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-blanco-suave mb-2">
              Barbería Clásica
            </h4>
            <p>El arte del cuidado masculino, perfeccionado.</p>
          </div>

          <div>
            <h4 className="font-semibold text-blanco-suave mb-2">Contacto</h4>
            <p>123 Calle Falsa, Ciudad</p>
            <p>555-123-4567</p>
            <p>contacto@barberia.com</p>
          </div>

          <div>
            <h4 className="font-semibold text-blanco-suave mb-2">Horario</h4>
            <p>Lunes a Viernes: 9am - 8pm</p>
            <p>Sábado: 10am - 6pm</p>
          </div>
        </div>

        <div className="max-w-6xl xl:max-w-7xl mx-auto px-3 border-t border-panel-medio/50 pt-4 text-[11px] text-texto-secundario/70">
          © 2024 Barbería Clásica. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
