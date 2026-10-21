import type { RefObject } from 'react';
import hero from '../assets/images/home/hero.webp';
import './home.css';

export default function HomePage({ heading, onStart }: {
  heading: RefObject<HTMLHeadingElement | null>;
  onStart: () => void;
}) {
  return <main id="main-content" className="home-page type-home-page">
    <div className="home-hero">
      <header className="home-top">
        <div className="home-brand">
          <span className="home-logo" role="img" aria-label="Колесо восьми триграмм" />
          <span className="home-brand-name type-brand">Автомобильная книга перемен</span>
        </div>
      </header>
      <img className="home-hero-image" src={hero} width="1672" height="941" fetchPriority="high"
        alt="Шесть линий Книги перемен переходят в сияющий янтарный автомобиль на горной дороге" />
      <div className="home-bottom">
        <h1 className="type-heading-1" ref={heading} tabIndex={-1}>Какой автомобиль похож на тебя?</h1>
        <div className="home-actions">
          <button className="home-cta type-home-button" onClick={onStart}>Начать игру <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
    <div className="home-below">
      <section className="home-section">
        <h2 className="type-heading-2">Об идее</h2>
        <div className="home-section-copy">
          <p className="type-home-body">У каждого человека свои привычки и отношение к жизни. У автомобилей тоже есть характер — по крайней мере, нам нравится так думать.</p>
          <p className="type-home-body">Мы соединили древнюю китайскую Книгу перемен с миром автомобилей и превратили эту встречу в небольшую игру. Здесь нет правильных и неправильных ответов — есть только твои предпочтения и немного автомобильной магии.</p>
        </div>
      </section>
      <section className="home-section">
        <h2 className="type-heading-2">Как это работает</h2>
        <div className="home-section-copy">
          <p className="type-home-body">В основе игры — 64 гексаграммы древней китайской Книги перемен. Каждая гексаграмма — это шестизначный двоичный код, составленный из сплошных и прерывистых линий.</p>
          <p className="type-home-body">Чтобы построить твой код, мы предложим тебе ответить на несколько вопросов о себе.</p>
          <p className="type-home-body">В реальной жизни мы редко делим всё на чёрное и белое. Но здесь тебе придётся иногда выбирать между двумя вариантами, даже если оба тебе близки. Именно из этих выборов и сложится твоя гексаграмма, а вместе с ней — автомобильный двойник.</p>
        </div>
      </section>
      <section className="home-section">
        <h2 className="type-heading-2">И ещё кое-что…</h2>
        <div className="home-section-copy">
          <p className="type-home-body">Это игра, а не психологический тест и уж тем более не руководство по выбору автомобиля.</p>
          <p className="type-home-body">Мы собрали коллекцию автомобилей, каждый из которых в своё время стал событием. Поэтому не обижайся, если тебе достанется машина из 50-х годов. Хорошее вино с возрастом только дорожает — почему бы автомобилям не последовать его примеру?</p>
        </div>
      </section>
    </div>
    <footer className="home-footer type-home-footer">© 2026 Автомобильная книга перемен</footer>
  </main>;
}
