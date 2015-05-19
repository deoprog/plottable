///<reference path="../../testReference.ts" />

var assert = chai.assert;

describe("Plots", () => {
  describe("AreaPlot", () => {
    // HACKHACK #1798: beforeEach being used below
    it("renders correctly with no data", () => {
      var svg = TestMethods.generateSVG(400, 400);
      var xScale = new Plottable.Scales.Linear();
      var yScale = new Plottable.Scales.Linear();
      var plot = new Plottable.Plots.Area(xScale, yScale);
      plot.x((d) => d.x, xScale);
      plot.y((d) => d.y, yScale);
      assert.doesNotThrow(() => plot.renderTo(svg), Error);
      assert.strictEqual(plot.width(), 400, "was allocated width");
      assert.strictEqual(plot.height(), 400, "was allocated height");
      svg.remove();
    });

    it("adds a padding exception to the y scale at the constant y0 value", () => {
      var svg = TestMethods.generateSVG(400, 400);
      var xScale = new Plottable.Scales.Linear();
      var yScale = new Plottable.Scales.Linear();
      yScale.padProportion(0.1);
      var constantY0 = 30;
      yScale.addExtentsProvider((scale: Plottable.Scales.Linear) => [[constantY0, constantY0 + 10]]);
      var plot = new Plottable.Plots.Area(xScale, yScale);
      plot.x((d) => d.x, xScale);
      plot.y((d) => d.y, yScale);
      plot.y0(constantY0, yScale);
      plot.addDataset(new Plottable.Dataset([{ x: 0, y: constantY0 + 5 }]));
      plot.renderTo(svg);
      assert.strictEqual(yScale.domain()[0], constantY0, "y Scale doesn't pad beyond 0 when used in a Plots.Area");
      svg.remove();
    });
  });

  describe("AreaPlot", () => {
    var svg: D3.Selection;
    var xScale: Plottable.Scales.Linear;
    var yScale: Plottable.Scales.Linear;
    var xAccessor: any;
    var yAccessor: any;
    var y0Accessor: any;
    var colorAccessor: any;
    var fillAccessor: any;
    var twoPointData = [{foo: 0, bar: 0}, {foo: 1, bar: 1}];
    var simpleDataset: Plottable.Dataset;
    var areaPlot: Plottable.Plots.Area<number>;
    var renderArea: D3.Selection;

    before(() => {
      xScale = new Plottable.Scales.Linear();
      xScale.domain([0, 1]);
      yScale = new Plottable.Scales.Linear();
      yScale.domain([0, 1]);
      xAccessor = (d: any) => d.foo;
      yAccessor = (d: any) => d.bar;
      y0Accessor = () => 0;
      colorAccessor = (d: any, i: number, m: any) => d3.rgb(d.foo, d.bar, i).toString();
      fillAccessor = () => "steelblue";
    });

    beforeEach(() => {
      svg = TestMethods.generateSVG(500, 500);
      simpleDataset = new Plottable.Dataset(twoPointData);
      areaPlot = new Plottable.Plots.Area(xScale, yScale);
      areaPlot.addDataset(simpleDataset);
      areaPlot.x(xAccessor, xScale)
              .y(yAccessor, yScale);
      areaPlot.y0(y0Accessor, yScale)
              .attr("fill", fillAccessor)
              .attr("stroke", colorAccessor)
              .renderTo(svg);
      renderArea = (<any> areaPlot)._renderArea;
    });

    it("draws area and line correctly", () => {
      var areaPath = renderArea.select(".area");
      assert.strictEqual(TestMethods.normalizePath(areaPath.attr("d")), "M0,500L500,0L500,500L0,500Z", "area d was set correctly");
      assert.strictEqual(areaPath.attr("fill"), "steelblue", "area fill was set correctly");
      var areaComputedStyle = window.getComputedStyle(areaPath.node());
      assert.strictEqual(areaComputedStyle.stroke, "none", "area stroke renders as \"none\"");

      var linePath = renderArea.select(".line");
      assert.strictEqual(TestMethods.normalizePath(linePath.attr("d")), "M0,500L500,0", "line d was set correctly");
      assert.strictEqual(linePath.attr("stroke"), "#000000", "line stroke was set correctly");
      var lineComputedStyle = window.getComputedStyle(linePath.node());
      assert.strictEqual(lineComputedStyle.fill, "none", "line fill renders as \"none\"");
      svg.remove();
    });

    it("area fill works for non-zero floor values appropriately, e.g. half the height of the line", () => {
      areaPlot.y0((d) => d.bar / 2, yScale);
      areaPlot.renderTo(svg);
      renderArea = (<any> areaPlot)._renderArea;
      var areaPath = renderArea.select(".area");
      assert.strictEqual(TestMethods.normalizePath(areaPath.attr("d")), "M0,500L500,0L500,250L0,500Z");
      svg.remove();
    });

    it("area is appended before line", () => {
      var paths = renderArea.selectAll("path")[0];
      var areaSelection = renderArea.select(".area")[0][0];
      var lineSelection = renderArea.select(".line")[0][0];
      assert.operator(paths.indexOf(areaSelection), "<", paths.indexOf(lineSelection), "area appended before line");
      svg.remove();
    });

    it("correctly handles NaN and undefined x and y values", () => {
      var areaData = [
        { foo: 0.0, bar: 0.0 },
        { foo: 0.2, bar: 0.2 },
        { foo: 0.4, bar: 0.4 },
        { foo: 0.6, bar: 0.6 },
        { foo: 0.8, bar: 0.8 }
      ];
      var expectedPath = "M0,500L100,400L100,500L0,500ZM300,200L400,100L400,500L300,500Z";
      var areaPath = renderArea.select(".area");

      var dataWithNaN = areaData.slice();
      dataWithNaN[2] = { foo: 0.4, bar: NaN };
      simpleDataset.data(dataWithNaN);

      var areaPathString = TestMethods.normalizePath(areaPath.attr("d"));
      TestMethods.assertAreaPathCloseTo(areaPathString, expectedPath, 0.1, "area d was set correctly (y=NaN case)");

      dataWithNaN[2] = { foo: NaN, bar: 0.4 };
      simpleDataset.data(dataWithNaN);

      areaPathString = TestMethods.normalizePath(areaPath.attr("d"));
      TestMethods.assertAreaPathCloseTo(areaPathString, expectedPath, 0.1, "area d was set correctly (x=NaN case)");

      var dataWithUndefined = areaData.slice();
      dataWithUndefined[2] = { foo: 0.4, bar: undefined };
      simpleDataset.data(dataWithUndefined);

      areaPathString = TestMethods.normalizePath(areaPath.attr("d"));
      TestMethods.assertAreaPathCloseTo(areaPathString, expectedPath, 0.1, "area d was set correctly (y=undefined case)");

      dataWithUndefined[2] = { foo: undefined, bar: 0.4 };
      simpleDataset.data(dataWithUndefined);

      areaPathString = TestMethods.normalizePath(areaPath.attr("d"));
      TestMethods.assertAreaPathCloseTo(areaPathString, expectedPath, 0.1, "area d was set correctly (x=undefined case)");

      svg.remove();
    });

    describe("getAllSelections()", () => {

      it("retrieves all selections with no args", () => {
        var newTwoPointData = [{ foo: 2, bar: 1 }, { foo: 3, bar: 2 }];
        areaPlot.addDataset(new Plottable.Dataset(newTwoPointData));
        var allAreas = areaPlot.getAllSelections();
        assert.strictEqual(allAreas.filter(".line").size(), 2, "2 lines retrieved");
        assert.strictEqual(allAreas.filter(".area").size(), 2, "2 areas retrieved");

        svg.remove();
      });

      it("retrieves correct selections", () => {
        var twoPointDataset = new Plottable.Dataset([{ foo: 2, bar: 1 }, { foo: 3, bar: 2 }]);
        areaPlot.addDataset(twoPointDataset);
        var allAreas = areaPlot.getAllSelections([twoPointDataset]);
        assert.strictEqual(allAreas.size(), 2, "areas/lines retrieved");
        var selectionData = allAreas.data();
        assert.include(selectionData, twoPointDataset.data(), "new dataset data in selection data");

        svg.remove();
      });

      it("skips invalid Datasets", () => {
        var twoPointDataset = new Plottable.Dataset([{ foo: 2, bar: 1 }, { foo: 3, bar: 2 }]);
        areaPlot.addDataset(twoPointDataset);
        var dummyDataset = new Plottable.Dataset([]);
        var allAreas = areaPlot.getAllSelections([twoPointDataset, dummyDataset]);
        assert.strictEqual(allAreas.size(), 2, "areas/lines retrieved");
        var selectionData = allAreas.data();
        assert.include(selectionData, twoPointDataset.data(), "new dataset data in selection data");

        svg.remove();
      });
    });

    it("retains original classes when class is projected", () => {
      var newClassProjector = () => "pink";
      areaPlot.attr("class", newClassProjector);
      areaPlot.renderTo(svg);
      var areaPath = renderArea.select("." + Plottable.Drawers.Area.AREA_CLASS);
      assert.isTrue(areaPath.classed("pink"));
      assert.isTrue(areaPath.classed(Plottable.Drawers.Area.AREA_CLASS));
      svg.remove();
    });
  });
});
