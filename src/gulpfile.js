// -------------------------------------------------------------
// import
import gulp from "gulp";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssSorter from "css-declaration-sorter";
import mmq from "gulp-merge-media-queries";
import browserSyncLib from "browser-sync";
import cleanCss from "gulp-clean-css";
import uglify from "gulp-uglify";
import rename from "gulp-rename";
import htmlBeautify from "gulp-html-beautify";
import pug from "gulp-pug";
import htmlmin from "gulp-html-minifier-terser";
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import imagemin from "gulp-imagemin";
import imageminWebp from "imagemin-webp";
import webp from "gulp-webp";

const browserSync = browserSyncLib.create();
const sass = gulpSass(dartSass);

// -------------------------------------------------------------
// gulp-check
export function test(done) {
    console.log("Hello gulp");
    done();
}
// -------------------------------------------------------------
// Sass
export function compileSass() {
    return gulp.src("./assets/sass/**/*.scss") // 入力
        .pipe(plumber({ // エラーハンドリング
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass()) // Sassをコンパイル
        .pipe(postcss([
            autoprefixer(), // ベンダープレフィックスの付与
            cssSorter({ order: "concentric-css" }) // CSSプロパティの並び順を整える
        ]))
        .pipe(mmq()) // メディアクエリをまとめる
        .pipe(gulp.dest("../assets/css")) // 非圧縮CSSを出力
        .pipe(cleanCss()) // CSSを圧縮
        .pipe(rename({ suffix: ".min" })) // ファイル名に.minを付ける
        .pipe(gulp.dest("../assets/css")) // 圧縮ファイルを出力
        .pipe(browserSync.stream()); // 変更部分のみをリロード
}
// -------------------------------------------------------------
// watch
export function watch() {
    gulp.watch("./assets/sass/**/*.scss", gulp.series(compileSass, browserReload));
    gulp.watch("./assets/js/**/*.js", gulp.series(minJS, browserReload));
    gulp.watch("./assets/pug/**/*.pug", gulp.series(compilePug, browserReload));
    gulp.watch("./assets/images/*.{png,jpg,jpeg}", gulp.series(convertToWebP, browserReload));
}
// -------------------------------------------------------------
// browserSync
export function browserInit(done) {
    browserSync.init({
        server: {
            baseDir: "../" // 静的サイトで使用
        },
        // proxy: "http://localhost:8000", // WordPress開発の場合
        notify: false,
    });
    done();
}
export function browserReload(done) {
    browserSync.reload();
    done();
}
// -------------------------------------------------------------
// images-convert-webp
export function convertToWebP() {
    return gulp.src("./assets/images/**/*.{png,jpg,jpeg}")
        .pipe(webp({
            quality: 85,
        }))
        .pipe(gulp.dest("../assets/images/webp")); // 出力先
}
// -------------------------------------------------------------
// JavaScript
export function minJS() {
    return gulp.src("./assets/js/**/*.js") // JavaScriptファイルを入力
        .pipe(plumber({ // エラーハンドリング
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(gulp.dest("../assets/js/")) // 圧縮前のファイルを出力
        .pipe(uglify()) // JavaScriptを圧縮
        .pipe(rename({ suffix: ".min" })) // ファイル名に.minを付ける
        .pipe(gulp.dest("../assets/js")) // 圧縮後のファイルを出力
        .pipe(browserSync.stream()); // 変更部分のみをリロード
}
// -------------------------------------------------------------
// compilePug
export function compilePug() {
    return gulp.src(["./assets/pug/**/*.pug", "!./assets/pug/**/_*.pug"])
        .pipe(plumber({ // エラーハンドリング
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(pug({
            pretty: true,
            basedir: "./pug"
        }))
        .pipe(htmlBeautify({
            indent_size: 4
        }))
        .pipe(gulp.dest("../"))
        .pipe(browserSync.stream()); // 変更部分のみをリロード
}
// -------------------------------------------------------------
export const develop = gulp.series(browserInit, watch);
export default develop;
