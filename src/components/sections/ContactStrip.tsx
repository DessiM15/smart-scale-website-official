import ContactForm from "@/components/ContactForm";

export default function ContactStrip() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-center">
          Have Questions?
        </h2>
        <p className="text-xl text-gray-300 mb-12 text-center">
          Get in touch with us to discuss your project.
        </p>
        <div className="bg-gray-900 p-8 rounded-lg">
          <ContactForm />
        </div>
        <div className="mt-12 text-center space-y-4">
          <p className="text-lg">
            <strong>Email:</strong>{" "}
            <a href="mailto:contact@smartscale.com" className="text-[#DC2626] hover:underline">
              contact@smartscale.com
            </a>
          </p>
          <p className="text-lg">
            <strong>Phone:</strong>{" "}
            <a href="tel:+1234567890" className="text-[#DC2626] hover:underline">
              (123) 456-7890
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

