const L = {
    map: jest.fn(() => ({
        setView: jest.fn(),
        locate: jest.fn(),
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        on: jest.fn(),
    })),
    tileLayer: jest.fn(() => ({
        addTo: jest.fn(),
    })),
    marker: jest.fn(() => ({
        addTo: jest.fn(),
        bindPopup: jest.fn(),
        openPopup: jest.fn(),
    })),
    circle: jest.fn(() => ({
        addTo: jest.fn(),
    })),
};

export default L;