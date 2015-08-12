/**
 * Created by Yuguang on 8/11/2015.
 */
$('#calculate').click(function () {
  var human = [];
  var computer = [];
  $('#hidden').html($('#human').val());
  $('#hidden a').each(function () {
    human.push($(this).text());
  });

  $('#hidden').html($('#computer').val());
  $('#hidden a').each(function () {
    computer.push($(this).text());
  });

  function precision(true_positives, false_positives) {
    return true_positives.length / (true_positives.length + false_positives.length);
  }


  function recall(true_positives, false_negatives) {
    return true_positives.length / (true_positives.length + false_negatives.length);
  }

  var positives = _.union(human, computer);
  var false_negatives = _.difference(human, computer);
  var false_positives = _.difference(computer, human);

  $('#precision').text(precision(positives, false_positives));
  $('#recall').text(recall(positives, false_negatives));
});
