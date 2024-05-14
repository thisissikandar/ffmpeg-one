import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { v4 as uuid4 } from "uuid";
import fs from "fs";
import { exec } from "child_process";

const app = express();

// multer middleware for
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.filename + "-" + uuid4() + path.extname(file.originalname));
  },
});
// multer configuration
const upload = multer({ storage: storage });

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5713"],
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => {
  res.send({ message: "hello world!" });
});
app.post("/upload", upload.single("file"), function (req, res) {
  const lessionId = uuid4();
  const videoPath = req.file.path;
  const outputPath = `./upload/cources/${lessionId}`;
  const hlsPath = `${outputPath}/index.m3u8`;
  console.log("hlsPath ::", hlsPath);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // ffmpeg
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}
   `;

  exec(ffmpegCommand, (err, stdout, stderr) => {
    if (err) {
      console.log("ERROR::", err);
    }
    console.log("STDOUT ::", stdout);
    console.log("STDERR ::", stderr);
    const videoUrl = `https://localhost:8000/upload/cources/${lessionId}/index.m3u8`;
    res.json({
      message: "Video converted successfully",
      video: videoUrl,
      lessionId: lessionId,
    });
  });
});

app.listen(8000, () => {
  console.log(`App listening on 8000`);
});
