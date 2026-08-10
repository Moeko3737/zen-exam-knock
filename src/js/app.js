// 科目選択ボタンをすべて取得する
const subjectCards = document.querySelectorAll(".subject-card");

// 各ボタンがクリックされたときの処理を設定する
subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    const subject = card.dataset.subject;

    console.log(`選択された科目: ${subject}`);
  });
});
