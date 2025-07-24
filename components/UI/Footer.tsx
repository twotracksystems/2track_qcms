import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer footer-center bg-white shadow-md text-black p-10">
      <aside>
        <Image
          src="/img/logo/aqm_logo.png"
          width={500}
          height={500}
          alt="AQM Parts Logo"
          className="object-scale-down h-24 w-24"
        />
        <p className="font-bold">
          <strong>AQM Parts</strong>
          <br />
          You can do it their way, or do it the right way
        </p>
        <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
      </aside>
      <nav>
        <div className="grid grid-flow-col gap-4">
          <a
            className="flex flex-col "
            href={"https://web.facebook.com/profile.php?id=61559089786607"}
            target="_blank"
          >
            <Image
              className="mx-auto"
              src="/img/svg/brand-facebook.svg"
              width={48}
              height={48}
              alt="Facebook"
            />

            <span className="text-center font-bold cursor-pointer">
              Assured Quality Manufacturing LLC
            </span>
          </a>
          <a
            className="flex flex-col "
            href={"https://discord.gg/9EEwhyqnAb"}
            target="_blank"
          >
            <Image
              className="mx-auto"
              src="/img/svg/brand-discord.svg"
              width={48}
              height={48}
              alt="Discord"
            />
            <span className="text-center  font-bold">AQM LLC</span>
          </a>
          <a className="flex flex-col ">
            <Image
              className="mx-auto"
              src="/img/svg/phone.svg"
              width={48}
              height={48}
              alt="Discord"
            />
            <span className="text-center  font-bold">585-410-3846</span>
          </a>
          <a className="flex flex-col ">
            <Image
              className="mx-auto"
              src="/img/svg/mail.svg"
              width={48}
              height={48}
              alt="Discord"
            />
            <span className="text-center  font-bold">info@aqm.parts</span>
          </a>
          <a
            className="flex flex-col col-span-2 cursor-pointer"
            href="https://maps.app.goo.gl/PduZXX1xhyWPJJsa8"
            target="_blank"
          >
            <Image
              className="mx-auto"
              src="/img/svg/map.svg"
              width={48}
              height={48}
              alt="Discord"
            />
            <span className="text-center font-bold">Brooklet, GA 132843</span>
          </a>
        </div>
      </nav>
    </footer>
  );
}
