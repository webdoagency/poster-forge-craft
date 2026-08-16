import { emptyContent, type BusinessType, type PostContent } from "./types";

/**
 * Neutral placeholder content used only for template thumbnails. No invented
 * company, person or customer data: labels describe the business type itself.
 */
const BY_TYPE: Record<BusinessType, Partial<PostContent>> = {
  travel_agency: {
    title: "Summer offer",
    subject: "Destination",
    location: "Hotel name",
    price: "590",
    date: "August",
    meta1: "7 nights",
    additionalText: "Limited places",
    services: ["Flights", "Hotel", "Transfer"],
    cta: "Send a message",
  },
  real_estate: {
    title: "New listing",
    subject: "City centre",
    price: "180000",
    meta1: "3 rooms",
    meta2: "92 m2",
    date: "Available now",
    additionalText: "Viewings this week",
    services: ["Balcony", "Parking", "Elevator"],
    cta: "Book a viewing",
  },
  car_dealership: {
    title: "In stock now",
    subject: "Model",
    price: "18900",
    meta1: "2022",
    meta2: "45 000 km",
    date: "Financing available",
    additionalText: "Full service history",
    services: ["Warranty", "Trade in"],
    cta: "Book a test drive",
  },
  restaurant: {
    title: "Today's special",
    subject: "Menu",
    price: "12",
    location: "City centre",
    date: "This week",
    additionalText: "Reservations recommended",
    services: ["Dine in", "Takeaway"],
    cta: "Reserve a table",
  },
  retail: {
    title: "New arrival",
    subject: "Category",
    price: "49",
    meta1: "-20%",
    date: "Until Sunday",
    additionalText: "While stock lasts",
    services: ["Delivery", "Returns"],
    cta: "Shop now",
  },
  other: {
    title: "Your headline",
    subject: "Product or service",
    price: "99",
    date: "This month",
    additionalText: "Short supporting line",
    services: ["Feature one", "Feature two"],
    cta: "Get in touch",
  },
};

export function placeholderContent(type: BusinessType): PostContent {
  return { ...emptyContent, services: [], ...BY_TYPE[type] } as PostContent;
}
