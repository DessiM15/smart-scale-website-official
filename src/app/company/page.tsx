import Link from "next/link";

const coreValues = [
  {
    title: "Precision",
    description: "Every detail matters. We deliver solutions with exacting standards.",
  },
  {
    title: "Communication",
    description: "Transparent, direct communication throughout every project.",
  },
  {
    title: "Transparency",
    description: "Clear processes, honest timelines, and open collaboration.",
  },
  {
    title: "Innovation",
    description: "Leveraging cutting-edge technology to solve complex problems.",
  },
  {
    title: "Client Partnership",
    description: "We're not just vendors—we're partners in your success.",
  },
];

const whySmartScale = [
  "Direct communication with founders",
  "High accountability",
  "No outsourcing, no middle layers",
  "Flexible and resource-efficient",
  "Fast turnaround times",
  "Proven across multiple industries",
  "Corporate reliability with boutique service",
];

export default function Company() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Company
          </h1>
        </div>
      </section>

      {/* About Smart Scale */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-black">
            About Smart Scale
          </h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Smart Scale is a Texas-based enterprise development studio
              specializing in custom software, AI workflows, automation systems,
              and digital infrastructure. Our approach combines engineering
              precision with a high-touch client experience. Every project is
              led directly by the company's owners to ensure consistent
              communication, accurate execution, and fast decision-making.
            </p>
            <p>
              We are committed to delivering structured, reliable, and scalable
              solutions that support long-term growth for businesses across
              multiple industries.
            </p>
          </div>
        </div>
      </section>

      {/* Why Smart Scale */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-black">
            Why Smart Scale
          </h2>
          <ul className="space-y-4">
            {whySmartScale.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-4 text-lg text-gray-700"
              >
                <span className="text-[#DC2626] font-bold mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">
            Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {coreValues.map((value, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-lg bg-white"
              >
                <h3 className="text-xl font-semibold mb-3 text-black">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Work Together?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss how we can help transform your business.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition"
          >
            Request Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}

