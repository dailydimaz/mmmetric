import * as React from "react";
import { Quote } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

const testimonials = [
    {
        quote: "We switched from Google Analytics because we were tired of the cookie banners. mmmetric gives us everything we need, and our site loads noticeably faster now.",
        author: "Sarah J.",
        role: "Frontend Engineer",
        company: "DevTools Inc."
    },
    {
        quote: "As a solo founder, I don't have time to decipher complex dashboards. mmmetric's UI is a breath of fresh air. I get my insights in seconds.",
        author: "Alex M.",
        role: "Indie Creator",
        company: "MicroSaaS"
    },
    {
        quote: "The ability to self-host and own 100% of our data was the main selling point. The fact that it looks gorgeous is just a massive bonus.",
        author: "David L.",
        role: "CTO",
        company: "Fintech Startup"
    },
    {
        quote: "Finally, an analytics tool that actually respects user privacy. Our bounce rate improved just by removing the giant cookie consent popup.",
        author: "Elena R.",
        role: "Marketing Lead",
        company: "E-commerce Plus"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <Badge variant="secondary" className="mb-4">
                        Wall of Love
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Loved by developers & founders
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Don't just take our word for it. Here's what they say.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2 md:-ml-4">
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
                                    <div className="p-1 h-full">
                                        <div className="h-full rounded-xl border bg-card p-8 flex flex-col justify-between shadow-sm">
                                            <div>
                                                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                                                <p className="text-lg text-card-foreground leading-relaxed italic mb-6">
                                                    "{testimonial.quote}"
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {testimonial.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{testimonial.author}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {testimonial.role} @ {testimonial.company}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex justify-center gap-4 mt-8">
                            <CarouselPrevious className="position-static translate-y-0" />
                            <CarouselNext className="position-static translate-y-0" />
                        </div>
                    </Carousel>
                </div>
            </div>
        </section>
    );
}
