import got from "got";
import nock from "nock";

describe("test1", () => {

    it("test", async function () {

        nock("http://api.openweathermap.org")
            .get("/")
            .reply(200, {test: "TEST"});

        const resp = await got("http://api.openweathermap.org", {json: true});
        expect(resp.body).toEqual({ test: "TEST" });
    });

});
