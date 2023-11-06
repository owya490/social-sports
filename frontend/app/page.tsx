//@ts-ignore
global.performance = global.performance || {
    now: () => new Date().getTime(),
};

export default function Home() {
    return <main></main>;
}
