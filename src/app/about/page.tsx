const AboutPage = () => {
    return <div
        className="flex flex-col items-center justify-center">
        <h3>
            About ShelfScan
        </h3>
        <p>
            ShelfScan began as a project to implement scanning
            of game barcodes and then interfacing with the
            <a href="https://gameupc.com" target="_blank">
                GameUPC API
            </a>.
        </p>
        <p>
            Having worked with the <a href="https://boardgamegeek.com" target="_blank">
                BoardGameGeek XML API
            </a> previously, and looking for good motivations for folks
            to come and use the scanner, I implemented collection lookup
            and matching.  Users were now able to use ShelfScan to audit
            their game libraries.
        </p>
        <p>
            My hope, though, was to help people add games to their collections.
            Whether they have just gotten a new game or find that they've
            missed one while taking inventory, how much easier could it get?
        </p>
        <p>
            Because of some technical limitations and licensing restrictions
            it is not feasible to directly add games from ShelfScan to BGG.
            But necessity is the mother of invention.
        </p>
        <p>
            I developed a browser extension, primarily targeted at mobile
            users - Safari/iOS and Firefox/Android - that bridges the gap
            between BGG and ShelfScan.  It opens the door to doing anything
            you can do on the BoardGameGeek website with the help of the app.
        </p>
        <p>
            Development continues on the web app and the browser extension.
            Soon the extension will be released to the public.  In the
            meantime, check out the blog and Facebook group to
            stay in the know.
        </p>
    </div>;
};

export default AboutPage;
