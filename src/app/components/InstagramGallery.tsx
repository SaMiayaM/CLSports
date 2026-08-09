import { useEffect } from "react";

export default function InstagramGallery() {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://elfsightcdn.com/platform.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <section id="instagram-gallery" className="instagram-gallery-section">
      <div className="section-header">
        <span className="section-kicker">Instagram</span>
        <h2>Follow the <span className="text-gradient-fire">Action</span> @clsportsclub</h2>
        <p>
          Stay connected with the latest highlights, events, and moments from CL
          Sports Club.
        </p>
      </div>

      <div
        className="elfsight-app-a66fe807-a340-4048-a455-be45ab74367b"
        data-elfsight-app-lazy
      />
    </section>
  );
}
