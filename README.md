<div align="center">
  <br/>
  <h1>✨ Ergili IDE</h1>
  <p><strong>Tarayıcı tabanlı, modern ve yetenekli bir VSCode klonu.</strong></p>
</div>

---

## 🚀 Proje Hakkında

**Ergili IDE**, tarayıcınız üzerinden hiçbir ek yazılım kurmadan kod yazmanıza, projelerinizi yönetmenize ve anında test etmenize olanak tanıyan web tabanlı bir kod editörüdür. Gerçek bir VSCode deneyimi sunmak üzere **Next.js**, **Tailwind CSS** ve **Monaco Editor** kullanılarak geliştirilmiştir.

Yazdığınız kodlar, açtığınız sekmeler ve yapılandırma ayarlarınız tarayıcınızın `localStorage` belleğinde otomatik olarak senkronize edilir, böylece sayfayı yenileseniz bile veri kaybı yaşamazsınız.

## 🌟 Öne Çıkan Özellikler

*   📂 **Gelişmiş Gezgin:** Tüm klasörü içeri aktarma, yeni dosya oluşturma, yeniden adlandırma ve silme.
*   📝 **Monaco Editor Entegrasyonu:** Sözdizimi vurgulama (Syntax highlighting), otomatik tamamlama ve minimap desteği.
*   ⚡ **Anında Önizleme:** Yazdığınız HTML/CSS/JS kodlarını tek tıkla ("Projeyi Çalıştır") yeni sekmede canlı olarak derleyip test etme imkanı.
*   💾 **ZIP Olarak İndirme:** Üzerinde çalıştığınız projeyi dilediğiniz zaman `.zip` formatında bilgisayarınıza indirebilme.
*   💻 **Dahili Terminal:** Özelleştirilmiş komutları (`help`, `ls`, `clear`, `date`, `run` vb.) destekleyen mock terminal ekranı.
*   ⚙️ **Kişiselleştirme:** VS-Dark/Light tema seçenekleri, font boyutu ayarlama, sözcük kaydırma (word wrap) ve minimap açıp kapatabilme.
*   ☁️ **Bulut Senkronizasyonu:** Tarayıcı önbelleğine otomatik kayıt özelliği.

## 🛠️ Kullanılan Teknolojiler

*   **[Next.js (App Router)](https://nextjs.org/)** - React Framework
*   **[Tailwind CSS](https://tailwindcss.com/)** - Stil ve tasarım
*   **[@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)** - Güçlü kod editörü motoru
*   **[JSZip](https://stuk.github.io/jszip/)** & **[FileSaver](https://github.com/eligrey/FileSaver.js/)** - Dosya paketleme ve indirme
*   **[Lucide React](https://lucide.dev/)** - Modern ikon seti

## 💻 Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

**Gereksinimler:** [Node.js](https://nodejs.org/en) (v18 veya üzeri önerilir)

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
