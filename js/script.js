document.addEventListener("DOMContentLoaded", () => {
    // GSAP Animation for Apps Section
    gsap.from(".content img", {
        scrollTrigger: {
            trigger: ".content",
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play none none none",
        },
        opacity: 0,
        y: 50,
        stagger: 0.3,
        duration: 1,
    });
});