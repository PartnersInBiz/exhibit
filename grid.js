(() => {
    const SIZE = 64;
    const GRID = $("#grid");
    const CAMERA = $("#camera");

    for (let x = 0; x < SIZE; x++)
    {
        for (let y = 0; y < SIZE; y++)
        {
            let position = x + " " + y + " " + "0";
            GRID.append('<a-plane material="src: grid.png" position="' + position + '"></a-plane>');
        }
    }

    CAMERA.attr("position", SIZE / 2 + " 5 -" + SIZE / 2);
})();