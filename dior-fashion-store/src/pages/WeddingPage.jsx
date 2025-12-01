// WeddingPage.jsx - Optimized Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './WeddingPage.css';
import { supabase } from '../lib/supabase';
import weddingHeroImg from '../assets/KIN08781okk.jpg';
import groomImg from '../assets/KIN08923okk.jpg';
import brideImg from '../assets/KIN08061ok.jpg';
import story1Img from '../assets/image1.jpg';
import story2Img from '../assets/loicauhon.jpg';
import story3Img from '../assets/image3.jpg';
import gallery from '../assets/1.jpg';
import gallery2 from '../assets/2.jpg';
import gallery3 from '../assets/3.jpg';
import gallery4 from '../assets/4.jpg';
import gallery5 from '../assets/5.jpg';
import gallery6 from '../assets/6.jpg';
import gallery7 from '../assets/7.jpg';
import qr1 from '../assets/qr1.jpg';
import qr2 from '../assets/qr2.jpg';

const WeddingInvitation = () => {
  const [countdown, setCountdown] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  // Lightbox state for gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // RSVP form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Config - Memoized để tránh recreate object mỗi lần render
  const config = useMemo(() => ({
    groomName: "Đoàn Đắc Đức",
    brideName: "Nguyễn Như Hằng",
    groomParents: "Con ông Đoàn Đắc Đảng & Bà Phương Thị Thúy",
    brideParents: "Con ông Nguyễn Trọng Thái & Bà Phạm Thị Thủy",
    weddingDate: "14 . 12 . 2025",

    images: {
      heroBackground: weddingHeroImg,
      groom: groomImg,
      bride: brideImg,
      story1: story1Img,
      story2: story2Img,
      story3: story3Img,
      gallery: [
        gallery,
        gallery2,
        gallery3,
        gallery4,
        gallery5,
        gallery6,
        gallery7,
      ],
      qrGroom: qr1,
      qrBride: qr2,
    },

    events: [
      {
        title: "LỄ VU QUY",
        icon: "fas fa-home",
        time: "16:00 • 4/12/2025",
        location: "Tư Gia Nhà Gái",
        address: "Xóm Trung Hậu, xã Thuần Trung, tỉnh Nghệ An",
        mapUrl: "https://maps.app.goo.gl/MDwrLr9DYmVzW5XDA"
      },
      {
        title: "TIỆC CƯỚI",
        icon: "fas fa-glass-cheers",
        time: "9:00 • 14/12/2025",
        location: "Nhà Văn Hóa Ngọc Thượng",
        address: "Ngọc Thượng, Lương Tài, Bắc Ninh",
        mapUrl: "https://maps.app.goo.gl/G2SeywcEKJw4oasj7"
      }
    ],

    bank: {
      groom: {
        name: "Techcombank",
        account: "1903 3847 787011",
        accountNumber: "19033847787011",
        holder: "DOAN DAC DUC"
      },
      bride: {
        name: "Techcombank",
        account: "265 269 1999",
        accountNumber: "2652691999",
        holder: "NGUYEN THI HANG"
      }
    }
  }), []);

  // Countdown timer - Optimized
  useEffect(() => {
    const weddingDate = new Date('2025-12-14T07:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance < 0) return;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({
        days: days < 10 ? '0' + days : days.toString(),
        hours: hours < 10 ? '0' + hours : hours.toString(),
        minutes: minutes < 10 ? '0' + minutes : minutes.toString(),
        seconds: seconds < 10 ? '0' + seconds : seconds.toString()
      });
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(interval);
  }, []);

  // Scroll reveal animation - Optimized with throttle
  useEffect(() => {
    let ticking = false;

    const reveal = () => {
      const reveals = document.querySelectorAll(".reveal");
      const windowHeight = window.innerHeight;
      const elementVisible = 150;

      for (let i = 0; i < reveals.length; i++) {
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(reveal);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    reveal();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Falling flowers animation - Optimized
  useEffect(() => {
    const types = ['🌸', '🌺', '🌹', '🌷', '🍃'];

    const createPetal = () => {
      const container = document.getElementById('flower-container');
      if (!container) return;

      const petal = document.createElement('div');
      petal.classList.add('petal');

      petal.innerText = types[Math.floor(Math.random() * types.length)];
      petal.style.left = Math.random() * 100 + 'vw';
      petal.style.animationDuration = Math.random() * 3 + 6 + 's';
      petal.style.fontSize = Math.random() * 15 + 15 + 'px';
      petal.style.opacity = (Math.random() * 0.5 + 0.3).toString();

      container.appendChild(petal);

      setTimeout(() => {
        petal.remove();
      }, 9000);
    };

    const interval = setInterval(createPetal, 400);
    return () => clearInterval(interval);
  }, []);

  // Form submission - Optimized with useCallback
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const formData = new FormData(e.target);
    const rsvpData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      attendance: formData.get('attendance') || 'attending',
      num_guests: parseInt(formData.get('num_guests')) || 1,
      message: formData.get('message')
    };

    try {
      const { data, error } = await supabase
        .from('wedding_rsvp')
        .insert([rsvpData])
        .select();

      if (error) throw error;

      setSubmitMessage('success');
      alert("✅ Cảm ơn lời chúc của bạn! Hẹn gặp bạn tại tiệc cưới.");
      e.target.reset();

      setTimeout(() => setSubmitMessage(''), 5000);
    } catch (error) {
      console.error('Error saving RSVP:', error);
      setSubmitMessage('error');
      alert("❌ Có lỗi xảy ra. Vui lòng thử lại sau!");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Copy to clipboard - Optimized with useCallback
  const copyToClipboard = useCallback((text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Đã sao chép số tài khoản: ' + text))
        .catch(() => {
          // Fallback method
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.top = "0";
          textArea.style.left = "0";

          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            document.execCommand('copy');
            alert('Đã sao chép số tài khoản: ' + text);
          } catch (err) {
            console.error('Error copying:', err);
          }

          document.body.removeChild(textArea);
        });
    }
  }, []);

  // Lightbox handlers - Optimized with useCallback
  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === config.images.gallery.length - 1 ? 0 : prevIndex + 1
    );
  }, [config.images.gallery.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? config.images.gallery.length - 1 : prevIndex - 1
    );
  }, [config.images.gallery.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;

      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

  return (
    <div className="wedding-invitation">
      {/* Falling flowers container */}
      <div id="flower-container"></div>

      {/* Navigation Menu */}
      <nav className="navbar">
        <a href="#home" className="nav-item">
          <i className="fas fa-home"></i> <span>Home</span>
        </a>
        <a href="#story" className="nav-item">
          <i className="fas fa-book-open"></i> <span>Chuyện Tình</span>
        </a>
        <a href="#events" className="nav-item">
          <i className="fas fa-calendar-alt"></i> <span>Sự Kiện</span>
        </a>
        <a href="#rsvp" className="nav-item">
          <i className="fas fa-envelope"></i> <span>RSVP</span>
        </a>
        <a href="#gift" className="nav-item">
          <i className="fas fa-gift"></i> <span>Mừng Cưới</span>
        </a>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="hero"
        style={{ backgroundImage: `url(${config.images.heroBackground})` }}
      >
        <div className="hero-content">
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
            Trân Trọng Kính Mời. Bạn bè, Cô chú, Bác bà, Anh chị em, và mọi người thân yêu nhất.
          </p>
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
            Đến dự lễ cưới
          </p>
          <h1 className="hero-names">Đắc Đức & Như Hằng</h1>
          <p className="hero-date">{config.weddingDate}</p>

          <div className="countdown-wrap">
            <div className="cd-box">
              <span className="cd-time">{countdown.days}</span>
              <span className="cd-label">Ngày</span>
            </div>
            <div className="cd-box">
              <span className="cd-time">{countdown.hours}</span>
              <span className="cd-label">Giờ</span>
            </div>
            <div className="cd-box">
              <span className="cd-time">{countdown.minutes}</span>
              <span className="cd-label">Phút</span>
            </div>
            <div className="cd-box">
              <span className="cd-time">{countdown.seconds}</span>
              <span className="cd-label">Giây</span>
            </div>
          </div>
        </div>
      </section>

      {/* Couple Section */}
      <section id="couple" className="section-padding couple-section">
        <div className="container">
          <div className="section-title reveal">
            <span className="sub-title">Groom & Bride</span>
            <h2 className="main-title">CÔ DÂU & CHÚ RỂ</h2>
          </div>

          <div className="couple-grid">
            {/* Chú Rể */}
            <div className="couple-card reveal">
              <img
                src={config.images.groom}
                alt="Groom"
                className="img-arch"
                loading="lazy"
              />
              <h3 className="couple-role">Chú Rể</h3>
              <h2 className="couple-name">{config.groomName}</h2>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{config.groomParents}</p>
            </div>

            <div className="heart-icon reveal">❦</div>

            {/* Cô Dâu */}
            <div className="couple-card reveal">
              <img
                src={config.images.bride}
                alt="Bride"
                className="img-arch"
                loading="lazy"
              />
              <h3 className="couple-role">Cô Dâu</h3>
              <h2 className="couple-name">{config.brideName}</h2>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{config.brideParents}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="section-padding story-section">
        <div className="container">
          <div className="section-title reveal">
            <span className="sub-title">Our Story</span>
            <h2 className="main-title">CHUYỆN TÌNH YÊU</h2>
          </div>

          <div className="timeline-item reveal">
            <img
              src={config.images.story1}
              alt="Story 1"
              className="story-img"
              loading="lazy"
            />
            <div className="story-text">
              <h3 className="story-year">2020 • Gặp Gỡ Đầu Tiên</h3>
              <p>Duyên số bắt đầu từ lời mời của cô Thy.</p>
              <p>Buổi tối hôm ấy, anh đã gặp em - định mệnh của đời mình.</p>
            </div>
          </div>

          <div className="timeline-item reveal">
            <img
              src={config.images.story2}
              alt="Story 2"
              className="story-img"
              loading="lazy"
            />
            <div className="story-text">
              <h3 className="story-year">2025 • Lời Cầu Hôn</h3>
              <p>Giây phút anh quỳ gối, là để hứa một đời che chở cho em</p>
            </div>
          </div>

          <div className="timeline-item reveal">
            <img
              src={config.images.story3}
              alt="Story 3"
              className="story-img"
              loading="lazy"
            />
            <div className="story-text">
              <h3 className="story-year">2025 • Hành Trình Mới</h3>
              <p>Và giờ đây, chúng tôi chuẩn bị bước vào chặng đường mới cùng nhau, với tình yêu và lời hứa sẽ luôn bên nhau trọn đời.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="section-padding events-section">
        <div className="container">
          <div className="section-title reveal">
            <span className="sub-title">When & Where</span>
            <h2 className="main-title">SỰ KIỆN</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {config.events.map((event, index) => (
              <div key={index} className="event-card reveal">
                <i className={event.icon + " event-icon"}></i>
                <h3>{event.title}</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '15px 0', color: 'var(--primary-pink)' }}>
                  <i className="far fa-clock"></i> {event.time}
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>{event.location}</p>
                <p style={{ color: '#666' }}>{event.address}</p>
                <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-map">
                  <i className="fas fa-map-marker-alt"></i> Xem Bản Đồ
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section with Lightbox */}
      <section className="section-padding gallery-section" style={{ background: 'white' }}>
        <div className="container">
          <div className="section-title reveal">
            <span className="sub-title">Memories</span>
            <h2 className="main-title">ALBUM HÌNH CƯỚI</h2>
            <p style={{ color: '#777', marginTop: '10px' }}>Những khoảnh khắc đẹp nhất của chúng tôi</p>
          </div>

          <div className="gallery-masonry">
            {config.images.gallery.map((img, index) => (
              <div key={index} className="gallery-item reveal" onClick={() => openLightbox(index)}>
                <div className="gallery-img-wrapper">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="gallery-img"
                    loading="lazy"
                  />
                  <div className="gallery-overlay">
                    <i className="fas fa-search-plus"></i>
                    <span className="gallery-label">Xem ảnh</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div className="lightbox-modal" onClick={closeLightbox}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <i className="fas fa-times"></i>
            </button>

            <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <i className="fas fa-chevron-left"></i>
            </button>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={config.images.gallery[currentImageIndex]}
                alt={`Gallery ${currentImageIndex + 1}`}
                className="lightbox-image"
              />
              <div className="lightbox-counter">
                {currentImageIndex + 1} / {config.images.gallery.length}
              </div>
            </div>

            <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="section-padding rsvp-section">
        <div className="container">
          <div className="rsvp-overlay">
            <div className="section-title">
              <span className="sub-title">Are you attending?</span>
              <h2 className="main-title" style={{ color: 'var(--text-dark)' }}>XÁC NHẬN THAM DỰ</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Họ và tên *"
                required
                disabled={isSubmitting}
              />
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="Số điện thoại"
                disabled={isSubmitting}
              />

              <select
                name="attendance"
                className="form-input"
                defaultValue="attending"
                disabled={isSubmitting}
              >
                <option value="attending">✅ Tôi sẽ tham dự</option>
                <option value="not_attending">❌ Tôi không thể tham dự</option>
                <option value="maybe">❓ Chưa chắc chắn</option>
              </select>

              <input
                type="number"
                name="num_guests"
                className="form-input"
                placeholder="Số người đi cùng (bao gồm bạn)"
                min="1"
                max="10"
                defaultValue="1"
                disabled={isSubmitting}
              />

              <textarea
                name="message"
                className="form-input"
                rows="4"
                placeholder="Lời chúc mừng của bạn"
                disabled={isSubmitting}
              ></textarea>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? '⏳ Đang gửi...' : '💌 Gửi xác nhận'}
              </button>

              {submitMessage === 'success' && (
                <p style={{ color: 'green', marginTop: '10px', fontWeight: '600' }}>
                  ✅ Đã gửi thành công! Cảm ơn bạn đã xác nhận.
                </p>
              )}
              {submitMessage === 'error' && (
                <p style={{ color: 'red', marginTop: '10px', fontWeight: '600' }}>
                  ❌ Có lỗi xảy ra. Vui lòng thử lại!
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Gift Section */}
      <section id="gift" className="section-padding gift-section">
        <div className="container">
          <div className="section-title reveal">
            <span className="sub-title">Wedding Gift</span>
            <h2 className="main-title">MỪNG CƯỚI</h2>
            <p style={{ color: '#777', marginTop: '10px' }}>
              Thay cho hoa tươi và quà cáp, bạn có thể gửi lời chúc đến chúng tôi qua:
            </p>
          </div>

          <div className="gift-grid">
            {/* Chú Rể */}
            <div className="gift-card reveal">
              <h3 style={{ color: 'var(--primary-pink)', marginBottom: '10px' }}>Mừng Chú Rể</h3>
              <img
                src={config.images.qrGroom}
                alt="QR Groom"
                className="qr-img"
                loading="lazy"
              />
              <div className="bank-info">
                <p><strong>Ngân hàng:</strong> {config.bank.groom.name}</p>
                <p>
                  <strong>Số TK:</strong> {config.bank.groom.account}
                  <button className="btn-copy" onClick={() => copyToClipboard(config.bank.groom.accountNumber)}>
                    <i className="far fa-copy"></i> Copy
                  </button>
                </p>
                <p><strong>Chủ TK:</strong> {config.bank.groom.holder}</p>
              </div>
            </div>

            {/* Cô Dâu */}
            <div className="gift-card reveal">
              <h3 style={{ color: 'var(--primary-pink)', marginBottom: '10px' }}>Mừng Cô Dâu</h3>
              <img
                src={config.images.qrBride}
                alt="QR Bride"
                className="qr-img"
                loading="lazy"
              />
              <div className="bank-info">
                <p><strong>Ngân hàng:</strong> {config.bank.bride.name}</p>
                <p>
                  <strong>Số TK:</strong> {config.bank.bride.account}
                  <button className="btn-copy" onClick={() => copyToClipboard(config.bank.bride.accountNumber)}>
                    <i className="far fa-copy"></i> Copy
                  </button>
                </p>
                <p><strong>Chủ TK:</strong> {config.bank.bride.holder}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p style={{ fontSize: '1.2rem', color: 'var(--primary-pink)', marginBottom: '10px' }}>
          ❤️ Thank You ❤️
        </p>
        <p style={{ color: '#666' }}>
          Rất hân hạnh được đón tiếp bạn!
        </p>
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#999' }}>
          © 2025 Wedding Invitation
        </p>
      </footer>
    </div>
  );
};

export default WeddingInvitation;