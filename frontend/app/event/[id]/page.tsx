export default function EventDetails({ params }: any) {
    return (
        <div className="h-screen bg-white text-black">
            <h1>
                yoohoo {params.id}
                <div className="gap-8 grid grid-cols-2 border-2">
                    <div className="col-span-1">Lol</div>
                    <div className="border-4 col-span-1">
                        This is some additional text inside the box. You can add
                        more paragraphs or content here.
                        <p>This</p>
                    </div>
                </div>
            </h1>
        </div>
    );
}
