/**
 * @jest-environment jsdom
 */

const React = require("react");
const { render, screen, fireEvent } = require("@testing-library/react");
require("@testing-library/jest-dom");

// ---- Mocks (hoisted by Jest) ----
jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props) => React.createElement("div", props, props.children),
    }
  ),
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

jest.mock("lucide-react", () => {
  const Icon = (props) => React.createElement("svg", { "data-testid": "icon", ...props });
  return {
    ArrowLeft: Icon,
    Heart: Icon,
    MessageCircle: Icon,
    Upload: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    X: Icon,
    Send: Icon,
    SortAsc: Icon,
    ImagePlus: Icon,
    Trash2: Icon,
  };
});

jest.mock("@/data/geoTable", () => ({
  buildings: [
    { id: "library", name: "Clark Library" },
    { id: "shiley", name: "Shiley School of Engineering" },
  ],
}));

let mockPhotos;
let mockStore;

jest.mock("@/store/appStore", () => ({
  useAppStore: () => mockStore,
}));

// ---- FileReader mock ----
class MockFileReader {
  readAsDataURL() {
    if (this.onload) {
      this.result = "data:image/png;base64,fake";
      this.onload();
    }
  }
}
global.FileReader = MockFileReader;

beforeEach(() => {
  document.body.innerHTML = "";
  jest.resetModules();
  jest.clearAllMocks();

  mockPhotos = [
    {
      id: "p1",
      buildingId: "library",
      imageUrl: "https://example.com/library.jpg",
      caption: "Library steps",
      uploadedAt: "2025-02-01T12:00:00.000Z",
      likes: 2,
      liked: false,
      comments: [{ id: "c1", author: "A", text: "Nice!" }],
    },
    {
      id: "p2",
      buildingId: "shiley",
      imageUrl: "https://example.com/shiley.jpg",
      caption: "Shiley entrance",
      uploadedAt: "2025-02-02T12:00:00.000Z",
      likes: 10,
      liked: true,
      comments: [],
    },
  ];

  mockStore = {
    photos: mockPhotos,
    toggleLike: jest.fn(),
    addComment: jest.fn(),
    addPhoto: jest.fn(),
    updatePhotoImage: jest.fn(),
    deletePhoto: jest.fn(),
  };

  window.alert = jest.fn();
});

describe("PhotoHubScreen basic rendering/navigation", () => {
  test("renders header + buttons", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    const onNavigate = jest.fn();

    render(React.createElement(PhotoHubScreen, { onNavigate }));

    expect(screen.getByText(/photo hub/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  test("clicking Home calls onNavigate('home')", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    const onNavigate = jest.fn();

    render(React.createElement(PhotoHubScreen, { onNavigate }));

    fireEvent.click(screen.getByRole("button", { name: /home/i }));
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  test("renders photo captions from store", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    expect(screen.getByText("Library steps")).toBeInTheDocument();
    expect(screen.getByText("Shiley entrance")).toBeInTheDocument();
  });
});

describe("PhotoHubScreen filter/sort UI", () => {
  test("shows default filter name", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    expect(screen.getByText(/all buildings/i)).toBeInTheDocument();
  });

  test("clicking next filter changes from All Buildings to first building with photos", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    // There are multiple icon-only buttons; first row order is prev, next, sort
    const buttons = screen.getAllByRole("button");
    const nextBtn = buttons[3]; // usually Home, Upload, Prev, Next, Sort...
    fireEvent.click(nextBtn);

    expect(screen.getByText(/clark library|shiley/i)).toBeInTheDocument();
  });

  test("sort dropdown opens and closes after choosing option", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    const buttons = screen.getAllByRole("button");
    const sortBtn = buttons[4]; // usually sort icon button in filter row
    fireEvent.click(sortBtn);

    expect(screen.getByRole("button", { name: /most liked/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /most liked/i }));

    expect(screen.queryByRole("button", { name: /most liked/i })).not.toBeInTheDocument();
  });
});

describe("PhotoHubScreen likes/comments", () => {
  test("clicking like calls toggleLike(photoId)", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    // Click the likes count "2" (inside like button for first photo)
    fireEvent.click(screen.getByText("2").closest("button"));

    expect(mockStore.toggleLike).toHaveBeenCalledWith("p1");
  });

  test("clicking comments button opens comments section", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    // Click first photo comment count "1"
    fireEvent.click(screen.getByText("1").closest("button"));

    expect(screen.getByPlaceholderText(/add comment/i)).toBeInTheDocument();
    expect(screen.getByText(/nice!/i)).toBeInTheDocument();
  });

  test("submitting a comment calls addComment and clears/close section", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByText("1").closest("button"));

    const input = screen.getByPlaceholderText(/add comment/i);
    fireEvent.change(input, { target: { value: "Great photo!" } });

    // Press Enter triggers handleComment
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(mockStore.addComment).toHaveBeenCalledWith("p1", "Great photo!");
  });

  test("blank comment does not call addComment", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByText("1").closest("button"));

    const input = screen.getByPlaceholderText(/add comment/i);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockStore.addComment).not.toHaveBeenCalled();
  });
});

describe("PhotoHubScreen upload modal", () => {
  test("clicking Upload opens modal", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
    expect(screen.getByText(/building/i)).toBeInTheDocument();
    expect(screen.getByText(/caption/i)).toBeInTheDocument();
  });

  test("upload action button is disabled until preview image exists", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    const uploadButtons = screen.getAllByRole("button", { name: /upload photo/i });
    const finalUploadBtn = uploadButtons[0];
    expect(finalUploadBtn).toBeDisabled();
  });

  test("selecting valid file creates preview and enables upload", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    const fileInput = document.querySelector('input[type="file"]:not(.hidden)') || document.querySelector('input[type="file"]');
    const file = new File(["abc"], "photo.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByAltText(/preview/i)).toBeInTheDocument();

    const uploadButtons = screen.getAllByRole("button", { name: /upload photo/i });
    const finalUploadBtn = uploadButtons[0];
    expect(finalUploadBtn).not.toBeDisabled();
  });

  test("oversized file shows alert and does not create preview", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    const fileInput = document.querySelector('input[type="file"]:not(.hidden)') || document.querySelector('input[type="file"]');
    const bigFile = new File(["x"], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 101 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(window.alert).toHaveBeenCalledWith("File too large. Maximum size is 100MB.");
    expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument();
  });

  test("clicking final Upload Photo calls addPhoto", () => {
    const PhotoHubScreen = require("../src/components/screens/photohub").default;
    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    fireEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    const fileInput = document.querySelector('input[type="file"]:not(.hidden)') || document.querySelector('input[type="file"]');
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const captionInput = screen.getByPlaceholderText(/describe your photo/i);
    fireEvent.change(captionInput, { target: { value: "My upload caption" } });

    const uploadButtons = screen.getAllByRole("button", { name: /upload photo/i });
    const finalUploadBtn = uploadButtons[0];
    fireEvent.click(finalUploadBtn);

    expect(mockStore.addPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        buildingId: expect.any(String),
        imageUrl: "data:image/png;base64,fake",
        caption: "My upload caption",
      })
    );
  });
});

describe("PhotoHubScreen empty state", () => {
  test("shows empty-state UI when no photos exist", () => {
    mockStore.photos = [];
    const PhotoHubScreen = require("../src/components/screens/photohub").default;

    render(React.createElement(PhotoHubScreen, { onNavigate: jest.fn() }));

    expect(screen.getByText(/no photos yet for this building/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /be the first to upload/i })).toBeInTheDocument();
  });
});