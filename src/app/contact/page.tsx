import ContactForm from "@/components/ContactForm";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            Contact Smart Scale
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get in touch to discuss your project and request an estimate.
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">
                Send us a message
              </h2>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Email
                  </h3>
                  <a
                    href="mailto:contact@smartscale.com"
                    className="text-[#DC2626] hover:underline text-lg"
                  >
                    contact@smartscale.com
                  </a>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Phone
                  </h3>
                  <a
                    href="tel:+1234567890"
                    className="text-[#DC2626] hover:underline text-lg"
                  >
                    (123) 456-7890
                  </a>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Location
                  </h3>
                  <p className="text-gray-700 text-lg">Texas, United States</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

