const clients = [
  {
    name: "Arbor Cove Funding",
    type: "image",
    src: "/assets/arbor-cove-logo-ss.png",
    alt: "Arbor Cove Funding",
  },
  {
    name: "Law Office of Sylvester R. Jaime",
    type: "text",
  },
  {
    name: "Mex Taco House",
    type: "image",
    src: "/assets/mex-taco-logo-ss.jpg",
    alt: "Mex Taco House",
  },
  {
    name: "Angels Churros N' Chocolate",
    type: "image",
    src: "/assets/angels-churros-logo-ss.webp",
    alt: "Angels Churros N' Chocolate",
  },
];

export default function OurClients() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-black">
          Our Clients
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {clients.map((client, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-20 md:h-24 lg:h-28 px-4"
            >
              {client.type === "image" ? (
                <img
                  src={client.src!}
                  alt={client.alt!}
                  className="object-contain h-full w-auto max-w-[200px] md:max-w-[240px] lg:max-w-[280px]"
                />
              ) : (
                <div className="text-xl md:text-2xl font-serif font-semibold text-gray-800 tracking-wide">
                  {client.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

