function showTab(name) {
            document.querySelectorAll(".ref-tab").forEach(function (t) {
                t.classList.remove("active");
            });
            document.querySelectorAll(".ref-panel").forEach(function (p) {
                p.classList.remove("active");
            });
            var tabs = ["io", "var", "arith", "flow", "func", "coll", "type", "sys"];
            var idx = tabs.indexOf(name);
            if (idx >= 0) document.querySelectorAll(".ref-tab")[idx].classList.add("active");
            var panel = document.getElementById("tab-" + name);
            if (panel) panel.classList.add("active");
        }

        // 스크롤 시 nav 활성 링크
        window.addEventListener("scroll", function () {
            var sections = ["features", "chars", "ide", "download", "reference"];
            var scrollY = window.scrollY + 80;
            sections.forEach(function (id) {
                var el = document.getElementById(id);
                if (!el) return;
                var link = document.querySelector('a[href="#' + id + '"]');
                if (!link) return;
                if (el.offsetTop <= scrollY && el.offsetTop + el.offsetHeight > scrollY) {
                    link.style.color = "var(--dot)";
                } else {
                    link.style.color = "";
                }
            });
        });